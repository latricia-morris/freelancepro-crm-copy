import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

const categoryLabels = {
  marketing: "Marketing",
  material: "Matériel",
  travel: "Déplacement",
  subcontracting: "Sous-traitance",
  software: "Logiciels",
  office: "Bureau",
  other: "Autre",
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'];

export default function MonthlyReport({ expenses }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Generate last 6 months data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
    
    const total = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return {
      month: format(date, "MMM", { locale: fr }),
      total,
      count: monthExpenses.length,
    };
  });

  // Category breakdown for current month
  const currentMonth = new Date();
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  
  const currentMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
  });

  const categoryData = Object.keys(categoryLabels).map(category => {
    const categoryExpenses = currentMonthExpenses.filter(e => e.category === category);
    const total = categoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return {
      name: categoryLabels[category],
      value: total,
    };
  }).filter(d => d.value > 0);

  const totalCurrentMonth = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Total']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#6366f1" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Month Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Répartition par catégorie - {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </CardTitle>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalCurrentMonth)}</p>
                <p className="text-sm text-slate-500">{currentMonthExpenses.length} dépenses</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Aucune dépense ce mois-ci</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}