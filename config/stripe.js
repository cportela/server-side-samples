"use strict";

const my_test_secret_key = "sk_test_123";
const test_secret_key = "sk_test_123";
const live_secret_key = "sk_live_123";

const OK = "OK";
const BANK_ACCOUNT = "bank_account";
const CARD = "card";

const TEST_MODE = true;
const secret_key = TEST_MODE ? my_test_secret_key : live_secret_key;

const stripe = require("stripe")(secret_key);

module.exports = (function () {
  // constructor
  function StripeCustomer(sc) {
    sc.sources = sc.sources || {};
    sc.sources.data = sc.sources.data || [];

    function storeCard(cc) {
      return getCards(sc.id).then((cards) => {
        const last4 = cc.number.slice(-4);
        let existCard = cards.find((card) => {
          return (
            card.brand &&
            card.last4 == last4 &&
            card.exp_month.toString().slice(-2) ==
            cc.exp_month.toString().slice(-2) &&
            card.exp_year.toString().slice(-2) ==
            cc.exp_year.toString().slice(-2)
          );
        });

        if (existCard) {
          const newCard = {
            id: existCard.id,
            name: existCard.name,
            exp_month: existCard.exp_month,
            exp_year: existCard.exp_year,
            last4: existCard.last4,
            metadata: existCard.metadata,
          };
          return newCard;
        }

        let cardObj = {
          object: CARD,
        };

        if (cc.name) cardObj.name = cc.name;
        if (cc.exp_month) cardObj.exp_month = cc.exp_month;
        if (cc.exp_year) cardObj.exp_year = cc.exp_year;
        if (cc.number) cardObj.number = cc.number;
        if (cc.cvc) cardObj.cvc = cc.cvc;
        if (cc.currency) cardObj.currency = cc.currency;
        if (cc.metadata) cardObj.metadata = cc.metadata;

        if (cc.address_city) cardObj.address_city = cc.address_city;
        if (cc.address_country) cardObj.address_country = cc.address_country;
        if (cc.address_line1) cardObj.address_line1 = cc.address_line1;
        if (cc.address_line2) cardObj.address_line2 = cc.address_line2;
        if (cc.address_state) cardObj.address_state = cc.address_state;
        if (cc.address_zip) cardObj.address_zip = cc.address_zip;

        if (cc.cc_alias) {
          cardObj.metadata = cardObj.metadata || {};
          Object.assign(cardObj.metadata, { cc_alias: cc.cc_alias });
        }

        return new Promise((resolve, reject) => {

          stripe.tokens.create({ card: cardObj }, (err, tokenObj) => {
            if (err) {
              reject(`Error tokenizing credit card: '${err}'`);
            } else {
              stripe.customers.createSource(
                sc.id,
                { source: tokenObj.id },
                (err, card) => {
                  if (err) {
                    reject(`Error associating credit card to user: '${err}'`);
                  } else {
                    instanceObj.sources.data.push(card);

                    const newCard = {
                      id: card.id,
                      cc_alias: cc.cc_alias,
                      name: card.name,
                      exp_month: card.exp_month,
                      exp_year: card.exp_year,
                      brand: card.brand,
                      last4: card.last4,
                      metadata: card.metadata,
                    };
                    resolve(newCard);
                  }
                }
              );
            }
          });
        });
      });
    }

    function getCard(card_id) {
      return new Promise((resolve, reject) => {
        stripe.customers.retrieveSource(sc.id, card_id, function (err, card) {
          if (err) {
            const message = `Error retrieving user card: '${err}'`;
            reject(message);
          } else {
            if (card) {
              const newCard = {
                id: card.id,
                name: card.name,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
                brand: card.brand,
                last4: card.last4,
                metadata: card.metadata,
              };
              if (card.metadata && card.metadata.cc_alias) {
                newCard.cc_alias = card.metadata.cc_alias;
              }
              resolve(newCard);
            } else {
              resolve(null);
            }
          }
        });
      });
    }

    function deleteCard(card_id) {
      return new Promise((resolve, reject) => {
        stripe.customers.deleteSource(sc.id, card_id, (err, confirmation) => {
          if (err) {
            reject(err);
          } else {
            resolve(confirmation);
          }
        });
      });
    }

    // Submit a charge using the current payment method
    function submitCharge(card_id, description, amount, metadata) {
      return new Promise((resolve, reject) => {
        if (!card_id) {
          throw new Error(
            "Invalid payment method, please specify a correct method"
          );
        }

        const chargeObj = {
          customer: instanceObj.id,
          currency: "usd",
          source: card_id,
          description: description,
          amount: amount,
          metadata: metadata || {},
        };

        // NOTE: for refunds use the stripe.refunds.create

        stripe.charges.create(chargeObj, function (err, charge) {
          if (err) {
            const message = `Error submitting ${
              chargeObj.amount ? "charge" : "credit"
              }: '${err}'`;
            reject(message);
          } else {
            resolve(charge);
          }
        });
      });
    }

    // Submit a charge using the current payment method
    function getCharges(limit = 100) {
      return new Promise((resolve, reject) => {
        let requestObj = {
          customer: instanceObj.id,
        };

        if (typeof limit === "number") {
          if (limit > 0) {
            requestObj.limit = limit;
          }
        }

        stripe.charges.list(requestObj, function (err, charges) {
          if (err) {
            let message = `Error retrieving history of charges: '${err}'`;
            reject(message);
          } else {
            if (charges && charges.data && charges.data.length > 0) {
              // For performance reasons we should send back only the fields
              // that may be needed by the application.
              let trimmed_charges = charges.data
                .map((charge) => {
                  return {
                    id: charge.id,
                    amount: charge.amount,
                    description: charge.description,
                    amount_refunded: charge.amount_refunded,
                    created: charge.created,
                    currency: charge.currency,
                    metadata: charge.metadata,
                    paid: charge.paid,
                    refunded: charge.refunded,
                    status: charge.status,
                  };
                })
                .filter((chg) => {
                  // Also, we should only send back charges that can be refunded;
                  // if the charge has not been paid, or the amount is zero, or if
                  // this charge has been completely refunded already then there is
                  // no need to return it to the client application.
                  return (
                    chg.paid &&
                    chg.amount > 0 &&
                    chg.amount_refunded < chg.amount
                  );
                });
              resolve(trimmed_charges);
            } else {
              resolve([]);
            }
          }
        });
      });
    }

    const instanceObj = Object.assign({}, sc, {
      storeCard,
      getCard,
      getCards,
      deleteCard,
      submitCharge,
      submitRefund,
      getCharges,
    });

    return instanceObj;
  }

  function validateCustomer(sc) {
    if (
      !sc ||
      typeof sc.email !== "string" ||
      sc.email.length === 0 ||
      typeof sc.description !== "string" ||
      sc.description.length === 0
    ) {
      return `Stripe customer object must have at least email and description properties`;
    }

    return OK;
  }

  // Metadata object is expected to be something like this:
  // metadata = {
  //    name: customer.name,
  //    customer_id: customer.id,
  //    master_customer_id: master.id,
  //    contact: customer.fname....,
  //    date_created: new Date()
  // }
  // but in reality can be anything
  function createCustomer(email, description, metadata) {
    return new Promise((resolve, reject) => {
      let rc = validateCustomer({ email, description });
      if (rc != OK) {
        throw new Error(rc);
      }

      stripe.customers.create(
        {
          email: email,
          description: description,
          metadata: metadata || {},
        },
        (err, customer) => {
          if (err) {
            reject(`Error creating a new Stripe customer: '${err}'`);
          } else {
            resolve(StripeCustomer(customer));
          }
        }
      );
    });
  }

  function retrieveCustomer(stripe_customer_id) {
    return new Promise((resolve, reject) => {
      if (
        typeof stripe_customer_id !== "string" ||
        stripe_customer_id.length === 0
      ) {
        throw new Error(`Invalid stripe customer id '${stripe_customer_id}'`);
      }

      stripe.customers.retrieve(stripe_customer_id, (err, customer) => {
        if (err) {
          reject(`Error retrieving Stripe customer: '${err}'`);
        } else if (customer.deleted) {
          reject(`The Stripe customer is marked deleted`);
        } else {
          resolve(StripeCustomer(customer));
        }
      });
    });
  }

  function removeCustomer(stripe_customer_id) {
    return new Promise((resolve, reject) => {
      if (
        typeof stripe_customer_id !== "string" ||
        stripe_customer_id.length === 0
      ) {
        throw new Error(`Invalid stripe customer id '${stripe_customer_id}'`);
      }

      stripe.customers.del(stripe_customer_id, (err, confirmation) => {
        if (err) {
          reject(`Error deleting Stripe customer: '${err}'`);
        } else {
          resolve(confirmation);
        }
      });
    });
  }

  return {
    createCustomer,
    retrieveCustomer,
    removeCustomer,
    clearPaymentMethods,
  };
})();
