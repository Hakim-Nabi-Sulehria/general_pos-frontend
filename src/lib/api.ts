import axios from 'axios';

/** Base URL for Nest API; set `VITE_API_URL` in production (e.g. https://api.example.com). */
const rawBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3000';
export const API_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. REQUEST INTERCEPTOR (Auto-attach Token) ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- 2. RESPONSE INTERCEPTOR (Handle 401 Logout) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expire ho gaya ya invalid hai -> Logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// --- 3. API ENDPOINTS ---

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  getAllUsers: () => api.get('/auth/users'), // <-- NEW for Staff Page
  bootstrapStatus: () => api.get<{ data: { superadminExists: boolean } }>('/auth/bootstrap/status'),
  bootstrapSuperadmin: (data: Record<string, unknown>, bootstrapSecret?: string) =>
    api.post('/auth/bootstrap/superadmin', data, {
      headers: bootstrapSecret
        ? { 'x-auth-bootstrap-secret': bootstrapSecret }
        : undefined,
    }),
};

export const organizationApi = {
  getAll: () => api.get("/organizations"),
  create: (data: any) => api.post("/organizations", data),
  update: (id: string, data: any) => api.put(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
};

export const branchApi = {
  getAll: () => api.get('/branches'),
  getById: (id: string) => api.get(`/branches/${id}`),
  create: (data: any) => api.post('/branches', data),
  update: (id: string, data: any) => api.put(`/branches/${id}`, data),
  delete: (id: string) => api.delete(`/branches/${id}`),
};

export const productApi = {
  getAll: () => api.get('/product'),
  getById: (id: string) => api.get(`/product/${id}`),
  create: (data: any) => api.post('/product', data),
  update: (id: string, data: any) => api.put(`/product/${id}`, data),
  delete: (id: string) => api.delete(`/product/${id}`),
};

export const supplierApi = {
  getAll: () => api.get('/supplier'),
  getById: (id: string) => api.get(`/supplier/${id}`),
  create: (data: any) => api.post('/supplier', data),
  update: (id: string, data: any) => api.put(`/supplier/${id}`, data),
  delete: (id: string) => api.delete(`/supplier/${id}`),
};

export const purchaseApi = {
  getAll: () => api.get('/purchase'),
  getById: (id: string) => api.get(`/purchase/${id}`),
  create: (data: any) => api.post('/purchase', data),
  update: (id: string, data: any) => api.put(`/purchase/${id}`, data),
  delete: (id: string) => api.delete(`/purchase/${id}`),
};

export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  adjust: (data: any) => api.post('/inventory/adjust', data),
};

export const transferApi = {
  getAll: () => api.get('/transfer'), 
  create: (data: any) => api.post('/inventory/transfer', data),
  updateStatus: (id: string, status: string) => api.patch(`/transfer/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/transfer/${id}`),
};

export const categoryApi = {
  getAll: () => api.get('/categoies'), 
  getOne: (id: string) => api.get(`/categoies/${id}`),
  create: (data: any) => api.post('/categoies', data),
  update: (id: string, data: any) => api.put(`/categoies/${id}`, data),
  delete: (id: string) => api.delete(`/categoies/${id}`),
};

export const discountApi = {
  getAll: () => api.get('/discount'),
  getActive: () => api.get('/discount/active'), 
  getById: (id: string) => api.get(`/discount/${id}`),
  create: (data: any) => api.post('/discount', data),
  update: (id: string, data: any) => api.patch(`/discount/${id}`, data),
  delete: (id: string) => api.delete(`/discount/${id}`),
  validate: (code: string) => api.post("/discount/validate",{ code }),
};

export const saleApi = {
  getAll: () => api.get('/sales'),
  create: (data: any) => api.post('/sales', data),
};

export const accountApi = {
    // Basic CRUD
    getAll: () => api.get('/accounts'),
    create: (data: any) => api.post('/accounts/create', data),
    recordExpense: (data: any) => api.post('/accounts/expense', data),
    seed: () => api.post('/accounts/seed', {}),

    // --- FILTERED REPORTING (Matches Controller Endpoints) ---
    
    // 1. Chart of Accounts (Uses Get /accounts)
    getCOASummary: (branchId: string) => 
        api.get(`/accounts?branchId=${branchId || ''}`),
        
    // 2. Balance Sheet
    getBalanceSheet: (branchId: string) => 
        api.get(`/accounts/balance-sheet?branchId=${branchId || ''}`),
        
    // 3. Income Statement (P&L)
    getIncomeStatement: (branchId: string) => 
        api.get(`/accounts/income-statement?branchId=${branchId || ''}`),
        
    // 4. Cash Flow
    getCashFlow: (branchId: string) => 
        api.get(`/accounts/cash-flow?branchId=${branchId || ''}`),
        
    // 5. Account Ledger Details
    getDetails: (id: string, branchId: string) => 
        api.get(`/accounts/ledger/${id}?branchId=${branchId || ''}`),
}
export const returnApi = {
    create: (data: any) => api.post('/returns', data),
    getAll: () => api.get('/returns')
};
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats')
};


export const cashRequestApi = {
 getMyRequests: () => api.get('/cash-requests/my'),
  

  create: (data: { amount: number; reason: string }) => api.post('/cash-requests', data),
  getIncomingRequests: () => api.get('/cash-requests/incoming'),
  

  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => 
    api.patch(`/cash-requests/${id}/status`, { status }),

  addCashDirectly: (data: { branchId: string; amount: number; reason: string }) => 
    api.post('/cash-requests/admin/add-cash', data),
  getBalanceOverview: () => api.get('/cash-requests/balance/overview')
};