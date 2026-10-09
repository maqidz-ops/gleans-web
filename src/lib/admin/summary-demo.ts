// Aggregate history for the admin overview demo, separate from editable sample records.
export const summaryDemo = { income: 12000000, orders: 360, queue: 240 };

export function summaryDemoHistory(today: string) {
  const pattern = [8, 12, 10, 14, 16, 11, 13];
  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 29 + index);
    const orders = index < 28 ? pattern[index % pattern.length] : index === 28 ? 10 : 14;
    return { date: day.toISOString().slice(0, 10), orders, income: orders * 30000 + 40000 };
  });
}
