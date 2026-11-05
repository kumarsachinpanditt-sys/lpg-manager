import {db} from './db';
import type {SaleInput} from './types';

const now=()=>new Date().toISOString();
const txid=(prefix:string)=>prefix+'-'+Date.now()+'-'+Math.floor(Math.random()*10000);
function positiveInt(n:number,label:string){if(!Number.isInteger(n)||n<0)throw new Error(label+' valid non-negative whole number hona chahiye.');}
function money(n:number,label:string){if(!Number.isFinite(n)||n<0)throw new Error(label+' valid amount hona chahiye.');}

export function recordSale(input:SaleInput) {
  positiveInt(input.soldQty,'Sold quantity'); positiveInt(input.returnedEmptyQty,'Returned empty quantity'); money(input.rate,'Rate'); money(input.paidAmount,'Paid amount');
  if(input.soldQty<=0) throw new Error('Kam se kam 1 cylinder sell karein.');
  if(input.returnedEmptyQty>input.soldQty) throw new Error('Returned empty cylinders sold quantity se zyada nahi ho sakte.');
  const hasCustomer=!!input.customerName.trim() || !!input.customerMobile.trim();
  if(hasCustomer && (!input.customerName.trim() || !/^\\d{10}$/.test(input.customerMobile))) throw new Error('Customer details dene par name aur 10-digit mobile dono zaroori hain.');
  if(!hasCustomer && (input.paidAmount!==total || input.soldQty!==input.returnedEmptyQty)) throw new Error('Counter sale mein full payment aur sabhi empty cylinder return hona chahiye.');
  const total=Number((input.soldQty*input.rate).toFixed(2));
  if(input.paidAmount>total) throw new Error('Paid amount bill se zyada nahi ho sakta.');
  const due=Number((total-input.paidAmount).toFixed(2));
  if(input.paymentMode==='CASH' && due!==0) throw new Error('Cash payment mein poora bill paid hona chahiye; Partial ya Credit chunein.');
  if((input.paymentMode==='UPI' || input.paymentMode==='CARD') && due!==0) throw new Error('UPI payment mein poora bill paid hona chahiye; Partial ya Credit chunein.');
  if(input.paymentMode==='CREDIT_Udhaari' && input.paidAmount!==0) throw new Error('Credit sale ke liye paid amount zero rakhein ya Partial chunein.');
  db.withTransactionSync(()=>{
    const stock=db.getFirstSync<any>('SELECT filled_cylinders,empty_cylinders FROM stock WHERE location_id=? AND category_id=?',[input.sourceLocationId,input.categoryId]);
    if(!stock || stock.filled_cylinders<input.soldQty) throw new Error('Available filled stock kam hai. Sale roki gayi.');
    db.runSync('UPDATE stock SET filled_cylinders=filled_cylinders-?,empty_cylinders=empty_cylinders+? WHERE location_id=? AND category_id=?',[input.soldQty,input.returnedEmptyQty,input.sourceLocationId,input.categoryId]);
    const pending=input.soldQty-input.returnedEmptyQty;
    if(hasCustomer) db.runSync('INSERT INTO customers(name,mobile,address,pending_empty_dues,credit_due) VALUES(?,?,?,?,?) ON CONFLICT(mobile) DO UPDATE SET name=excluded.name,address=excluded.address,pending_empty_dues=customers.pending_empty_dues+excluded.pending_empty_dues,credit_due=customers.credit_due+excluded.credit_due',[input.customerName.trim(),input.customerMobile,input.customerAddress,pending,due]);
    if(input.paymentMode==='CASH' || input.paymentMode==='PARTIAL') db.runSync('UPDATE users SET current_cash_in_hand=current_cash_in_hand+? WHERE id=?',[input.paymentMode==='CASH'?input.paidAmount:input.paidAmount,input.staffId]);
    db.runSync(`INSERT INTO transactions(transaction_id,timestamp,type,executed_by_staff_id,source_location_id,category_id,filled_qty,empty_qty,rate,line_total,total_amount,payment_mode,paid_amount,balance_due,customer_name,customer_mobile,customer_address,remarks) VALUES(?,?, 'SALE',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[txid('SALE'),now(),input.staffId,input.sourceLocationId,input.categoryId,input.soldQty,input.returnedEmptyQty,input.rate,total,total,input.paymentMode,input.paidAmount,due,hasCustomer?input.customerName:null,hasCustomer?input.customerMobile:null,hasCustomer?input.customerAddress:null,input.remarks??'']);
  });
  return {total,paid:input.paidAmount,due,emptyDue:input.soldQty-input.returnedEmptyQty};
}

export function transferStock(staffId:number,from:number,to:number,categoryId:number,filledQty:number,emptyQty:number) {
  positiveInt(filledQty,'Filled qty');positiveInt(emptyQty,'Empty qty');if(from===to)throw new Error('Source aur destination alag hone chahiye.');if(filledQty+emptyQty===0)throw new Error('Transfer quantity enter karein.');
  db.withTransactionSync(()=>{
    const s=db.getFirstSync<any>('SELECT filled_cylinders,empty_cylinders FROM stock WHERE location_id=? AND category_id=?',[from,categoryId]);
    if(!s||s.filled_cylinders<filledQty||s.empty_cylinders<emptyQty)throw new Error('Source location par paryapt stock nahi hai.');
    db.runSync('INSERT OR IGNORE INTO stock(location_id,category_id) VALUES(?,?)',[to,categoryId]);
    db.runSync('UPDATE stock SET filled_cylinders=filled_cylinders-?,empty_cylinders=empty_cylinders-? WHERE location_id=? AND category_id=?',[filledQty,emptyQty,from,categoryId]);
    db.runSync('UPDATE stock SET filled_cylinders=filled_cylinders+?,empty_cylinders=empty_cylinders+? WHERE location_id=? AND category_id=?',[filledQty,emptyQty,to,categoryId]);
    db.runSync(`INSERT INTO transactions(transaction_id,timestamp,type,executed_by_staff_id,source_location_id,target_location_id,category_id,filled_qty,empty_qty,remarks) VALUES(?,?, 'INTERNAL_TRANSFER',?,?,?,?,?,?,?)`,[txid('MOVE'),now(),staffId,from,to,categoryId,filledQty,emptyQty,'Internal stock transfer']);
  });
}

export function vendorInward(staffId:number,locationId:number,categoryId:number,filledQty:number,emptyQty:number,defectiveQty:number,remarks='Vendor inward') {
  positiveInt(filledQty,'Filled qty');positiveInt(emptyQty,'Empty qty');positiveInt(defectiveQty,'Defective qty');if(filledQty+emptyQty+defectiveQty===0)throw new Error('Inward quantity enter karein.');
  db.withTransactionSync(()=>{
    db.runSync('INSERT OR IGNORE INTO stock(location_id,category_id) VALUES(?,?)',[locationId,categoryId]);
    db.runSync('UPDATE stock SET filled_cylinders=filled_cylinders+?,empty_cylinders=empty_cylinders+?,defective_cylinders=defective_cylinders+? WHERE location_id=? AND category_id=?',[filledQty,emptyQty,defectiveQty,locationId,categoryId]);
    db.runSync(`INSERT INTO transactions(transaction_id,timestamp,type,executed_by_staff_id,target_location_id,category_id,filled_qty,empty_qty,remarks) VALUES(?,?, 'VENDOR_INWARD',?,?,?,?,?,?)`,[txid('IN'),now(),staffId,locationId,categoryId,filledQty,emptyQty,remarks+'; defective='+defectiveQty]);
  });
}

export function handoverCash(staffId:number,adminId:number,amount:number) {
  money(amount,'Handover amount');if(amount<=0)throw new Error('Handover amount zero se zyada hona chahiye.');
  let receipt='';
  db.withTransactionSync(()=>{
    const staff=db.getFirstSync<any>('SELECT current_cash_in_hand FROM users WHERE id=?',[staffId]);
    if(!staff||staff.current_cash_in_hand<amount)throw new Error('Staff ke paas itna cash available nahi hai.');
    db.runSync('UPDATE users SET current_cash_in_hand=current_cash_in_hand-? WHERE id=?',[amount,staffId]);
    db.runSync('UPDATE agency_vault SET balance=balance+? WHERE id=1',[amount]);
    const vault=db.getFirstSync<any>('SELECT balance FROM agency_vault WHERE id=1');
    const after=Number((staff.current_cash_in_hand-amount).toFixed(2));const vaultAfter=Number(vault.balance);
    receipt=txid('HANDOVER');
    db.runSync('INSERT INTO cash_handover_receipts(receipt_no,staff_id,admin_id,amount,created_at,staff_cash_after,owner_vault_after) VALUES(?,?,?,?,?,?,?)',[receipt,staffId,adminId,amount,now(),after,vaultAfter]);
    db.runSync(`INSERT INTO transactions(transaction_id,timestamp,type,executed_by_staff_id,total_amount,paid_amount,remarks) VALUES(?,?, 'STAFF_CASH_HANDOVER',?,?,?,?)`,[receipt,now(),staffId,amount,amount,'Cash handover receipt: '+receipt]);
  });
  return receipt;
}
