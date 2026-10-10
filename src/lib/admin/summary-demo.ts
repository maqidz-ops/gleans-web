// Aggregate history for the admin overview demo, separate from editable sample records.
const students = 1200;
const checksPerStudent = 2;
const pricePerFile = 10000;
const totalOrders = students * checksPerStudent;
export const summaryDemo = { income: totalOrders * pricePerFile, orders: totalOrders, queue: 240 };

export function summaryDemoHistory(today: string) {
  const pattern = [8, 12, 10, 14, 16, 11, 13];
  const weights = Array.from({ length: 30 }, (_, index) => index < 28 ? pattern[index % pattern.length] : index === 28 ? 10 : 14);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cumulativeWeight = 0;
  let allocatedOrders = 0;
  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 29 + index);
    cumulativeWeight += weights[index];
    const cumulativeOrders = Math.round(cumulativeWeight / totalWeight * totalOrders);
    const orders = cumulativeOrders - allocatedOrders;
    allocatedOrders = cumulativeOrders;
    return { date: day.toISOString().slice(0, 10), orders, income: orders * pricePerFile };
  });
}
