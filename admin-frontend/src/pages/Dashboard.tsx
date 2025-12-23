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

  const { data: activeUsersChart } = useQuery({
    queryKey: ['active-users-chart'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getActiveUsersChart(24);
      return response.data;
    },
  });

  const { data: currentlyActive } = useQuery({
    queryKey: ['currently-active'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getCurrentlyActive(20);
      return response.data;
    },
  });

  const { data: recentlyActive } = useQuery({
    queryKey: ['recently-active'],
    queryFn: async () => {
      const response = await adminApi.dashboard.getRecentlyActive(20);
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

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Users (Last 24 Hours)</h2>
        {activeUsersChart && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activeUsersChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Line type="monotone" dataKey="activeUsers" stroke="#8b5cf6" strokeWidth={2} name="Active Users" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Currently Active Users</h2>
          <p className="text-sm text-gray-600 mb-4">Active in the last 5 minutes</p>
          <div className="space-y-3">
            {currentlyActive?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {new Date(user.lastActiveAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {(!currentlyActive || currentlyActive.length === 0) && (
              <p className="text-gray-500 text-center py-4">No currently active users</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Active Users</h2>
          <p className="text-sm text-gray-600 mb-4">Active in the last 24 hours</p>
          <div className="space-y-3">
            {recentlyActive?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {new Date(user.lastActiveAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(!recentlyActive || recentlyActive.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recently active users</p>
            )}
          </div>
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
