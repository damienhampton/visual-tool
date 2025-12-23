import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getStats();
      return response.data;
    },
  });

  const { data: revenueChart } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getRevenueChart(30);
      return response.data;
    },
  });

  const { data: userGrowthChart } = useQuery({
    queryKey: ['user-growth-chart'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getUserGrowthChart(30);
      return response.data;
    },
  });

  const { data: topUsers } = useQuery({
    queryKey: ['top-users'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getTopUsers(10);
      return response.data;
    },
  });

  const { data: recentSignups } = useQuery({
    queryKey: ['recent-signups'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getRecentSignups(5);
      return response.data;
    },
  });

  if (statsLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.users.total}</p>
              <p className="text-sm text-green-600 mt-1">
                +{stats?.users.newWeek} this week
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.subscriptions.active}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.subscriptions.pro} Pro, {stats?.subscriptions.team} Team
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats?.revenue.mrr}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ${stats?.revenue.arr} ARR
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Diagrams</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.diagrams.total}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.diagrams.averagePerUser} avg per user
              </p>
            </div>
            <FileText className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue (Last 30 Days)</h2>
          {revenueChart && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Growth (Last 30 Days)</h2>
          {userGrowthChart && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="signups" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Users by Diagrams</h2>
          <div className="space-y-3">
            {topUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{user.diagramCount}</p>
                  <p className="text-xs text-gray-600">diagrams</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Signups</h2>
          <div className="space-y-3">
            {recentSignups?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  {user.isGuest && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Guest</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
