/**
 * !! ATTENTION PLEASE !!
 * Please refer to the documentation at https://developer.bka.sh for information on bKash.
 */
import fs from 'fs';
import path from 'path';

export const createPayment = ({ bkash }) => async (req, res) => {
  try {
    const createAgreement = await bkash.createAgreement({
      mode: "0000",
      payerReference: req.body.phone,
      email: req.body.email,
      totalPrice: req.body.totalPrice,
    });
    res.status(200).send(createAgreement?.bkashURL);
  } catch (error) {
    res.status(500).send('something went wrong');
  }
};

// execute agreement and create payment
export const executeAgreement = ({ bkash, config }) => async (req, res) => {

  let paymentID = req.query.paymentID;
  let email = req.query.email;

  const execute = await bkash.executeAgreement(paymentID); // executing the agreement with the paymentID

  console.log("agreement executed",execute)


  if (Number(execute.statusCode) !== 2054) {
    const crtPayment = await bkash.createPayment({
      mode: '0001',
      merchantAssociationInfo: 'MI05MID54RF09123456One',
      merchantInvoiceNumber: 'Inv0121', 
      amount: req.query.totalPrice, 
      payerReference: execute?.payerReference,
      agreementID: execute?.agreementID,
      baseURL: config.api + '/api/bkash/execute/payment?email=' + email
    });

    console.log('payment created',crtPayment);

    return await res.redirect(crtPayment.bkashURL);
  }
  await res.redirect(config.base);
};

// execute payment
export const executePayment = ({config,bkash,mail}) => async (req,res) => {
  console.log("executing payment");

  const email = req.query.email;
  const paymentID =  req.query.paymentID;
  const executedPayment = await bkash.executePayment({ paymentID });

    console.log('payment executed',executedPayment);


    // Send a Confirmation Email
    if (executedPayment.statusCode === '0000') {


    // let paymentStatus =  await bkash.paymentStatus(executedPayment?.paymentID)
    // console.log('payment status',paymentStatus)
    // const transaction = await bkash.searchTransaction(executedPayment?.trxID);
    // console.log("transaction",transaction)

      await mail({
        receiver: email,
        subject: 'Coding test',
        body: fs.readFileSync(path.resolve(__dirname, 'templates', 'emailTemplate.html')),
        type: 'html'
      });

       // Redirect to webpage to show a modal
        res.redirect(config.base + '?buy=success&email=' + email);

    }else {
      res.redirect(config.base + '?buy=failure');
    }
  
}


export const status = ({ config }) => async (req, res) => {
console.log("checking status",req.query)

  let email = req.query.email;
  res.redirect(config.base + '?buy=success?email=' + email);
};
