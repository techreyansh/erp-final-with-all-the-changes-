// Utility to check if a PO is fully dispatched
export function isPOFullyDispatched(po, dispatchRecords) {
  if (!po || !dispatchRecords) return false;
  const dispatched = dispatchRecords.filter(
    (r) =>
      r.UniqueId === po.UniqueId && // Check by UniqueId for precise matching
      r.Dispatched === "Yes"
  );
  // If any record for this PO is dispatched, consider it dispatched (customize as needed)
  return dispatched.length > 0;
}

// Utility to calculate batches for a set of POs for a client and optionally a product
export function calculateBatchesForPOs(
  pos,
  dispatchRecords,
  clientCode,
  productCode = null,
  specificUniqueId = null
) {
  // Get already dispatched Unique IDs for more precise filtering
  const alreadyDispatchedUniqueIds = dispatchRecords
    .filter(record => record.Dispatched === "Yes")
    .map(record => record.UniqueId);
    
  let undeliveredPOs;
  
  if (specificUniqueId) {
    // If specific Unique ID is provided, only process that exact item
    undeliveredPOs = pos.filter(
      (po) =>
        po.UniqueId === specificUniqueId &&
        po.Status !== "DISPATCH" &&
        !alreadyDispatchedUniqueIds.includes(po.UniqueId)
    );
  } else {
    // Original logic for general dispatch
    undeliveredPOs = pos.filter(
      (po) =>
        po.ClientCode === clientCode &&
        po.Status !== "DISPATCH" &&
        !alreadyDispatchedUniqueIds.includes(po.UniqueId) &&
        (productCode ? po.ProductCode === productCode : true)
    );
  }
  
  const productMap = {};
  undeliveredPOs.forEach((po) => {
    if (!productMap[po.ProductCode]) {
      productMap[po.ProductCode] = 0;
    }
    productMap[po.ProductCode] += Number(po.Quantity || 0);
  });

  // If we're dispatching a single specific item, treat it as a single batch
  // so the user picks ONE dispatch date for the whole quantity.
  let allBatches = [];
  if (specificUniqueId) {
    Object.entries(productMap).forEach(([productCode, qty]) => {
      allBatches.push({
        productCode,
        batchNumber: 1,
        batchSize: qty,
        date: "",
        time: "",
      });
    });
  } else {
    // Original logic: split into multiple batches based on BatchSize
    Object.entries(productMap).forEach(([productCode, qty]) => {
      const po = undeliveredPOs.find((po) => po.ProductCode === productCode);
      let batchSize = 4000;
      if (
        po &&
        po.BatchSize &&
        !isNaN(Number(po.BatchSize)) &&
        Number(po.BatchSize) > 0
      ) {
        batchSize = parseInt(po.BatchSize, 10);
      }
      const numBatches = Math.ceil(qty / batchSize);
      for (let i = 0; i < numBatches; i++) {
        allBatches.push({
          productCode,
          batchNumber: i + 1,
          batchSize: i === numBatches - 1 ? qty - batchSize * i : batchSize,
          date: "",
          time: "",
        });
      }
    });
  }

  return {
    batches: allBatches,
    totalQuantity: Object.values(productMap).reduce((sum, qty) => sum + qty, 0),
  };
}
