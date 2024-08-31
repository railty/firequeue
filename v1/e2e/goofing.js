import fs from "fs/promises";

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const ask = async (taskId)=>{
  await sleep(3000);
  return `
  \`\`\`xml
  <EInvoice>
    <EInvoiceData>
      <SellerInformation>
        <SellerName>UNITED DAIRY AND GROCERS INC</SellerName>
      </SellerInformation>
      <BuyerInformation>
        <BuyerName>AL PREMIUM FOOD MART</BuyerName>
      </BuyerInformation>
      <BasicInformation>
        <TotalAmWithoutTax>3879.03</TotalAmWithoutTax>
      </BasicInformation>
      <IssuItemInformation>
      </IssuItemInformation>
    </EInvoiceData>
  </EInvoice>
  \`\`\`
  `;
}
