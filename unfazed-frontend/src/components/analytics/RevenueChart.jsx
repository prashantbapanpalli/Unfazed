import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function RevenueChart({ data }) {
  if (!data?.length) return <p className="text-sm text-slate-500">No payments yet.</p>
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="gross" name="Gross" fill="#94a3b8" />
        <Bar dataKey="net" name="Net (after fee)" fill="#2f8f78" />
      </BarChart>
    </ResponsiveContainer>
  )
}
