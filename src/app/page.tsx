'use client'

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, IndianRupee, MapPin, Check, Plus, X,
  Banknote, Smartphone, Loader2, Users, RefreshCw, CheckCircle2,
  User, AlertCircle, Calendar, LayoutDashboard, ClipboardList,
  TrendingUp, Wallet, Trash2, Receipt, Lock, LogIn, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PersonData {
  rowIndex: number;
  name: string;
  phone?: string;
  address?: string;
  fy2627TakaJama?: string;
  paymentType?: string;
  paymentDate?: string;
  status?: string;
  givenAmount?: string;
  returnAmount?: string;
  returnAmountType?: string;
}

interface CollectionStats {
  totalCollection: number;
  onlineCollection: number;
  cashCollection: number;
  totalPeople: number;
  paidPeople: number;
  duePeople: number;
  totalExpenses: number;
  netBalance: number;
}

interface DateWiseCollection {
  date: string;
  total: number;
  cash: number;
  online: number;
  count: number;
}

interface ExpenseData {
  rowIndex: number;
  description: string;
  amount: string;
  date: string;
  paymentType?: string;
}

type TabType = 'dashboard' | 'collection' | 'expense';
type FilterType = 'all' | 'paid' | 'due';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Collection states
  const [searchTerm, setSearchTerm] = useState('');
  const [allNames, setAllNames] = useState<PersonData[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [givenAmount, setGivenAmount] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [returnAmountType, setReturnAmountType] = useState<'cash' | 'online'>('cash');
  const [paymentType, setPaymentType] = useState<'cash' | 'online'>('cash');
  const [paymentDate, setPaymentDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // New entry form
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newIsDue, setNewIsDue] = useState(false);
  
  // Dashboard states
  const [stats, setStats] = useState<CollectionStats>({
    totalCollection: 0,
    onlineCollection: 0,
    cashCollection: 0,
    totalPeople: 0,
    paidPeople: 0,
    duePeople: 0,
    totalExpenses: 0,
    netBalance: 0,
  });
  const [dateWiseData, setDateWiseData] = useState<DateWiseCollection[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  
  // Expense states
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expensePaymentType, setExpensePaymentType] = useState<'cash' | 'online'>('online');
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { toast } = useToast();

  // Calculate payment amount from given and return
  useEffect(() => {
    const given = parseFloat(givenAmount) || 0;
    const ret = parseFloat(returnAmount) || 0;
    const payment = given - ret;
    setPaymentAmount(payment > 0 ? payment.toString() : '');
  }, [givenAmount, returnAmount]);

  // Filter data
  const filteredNames = allNames.filter(person => {
    if (filter === 'all') return true;
    if (filter === 'paid') return person.status === 'Paid';
    if (filter === 'due') return person.status === 'Due';
    return true;
  });

  const searchResults = searchTerm.trim() === '' 
    ? filteredNames 
    : filteredNames.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const allCount = allNames.length;
  const paidCount = allNames.filter(p => p.status === 'Paid').length;
  const dueCount = allNames.filter(p => p.status === 'Due').length;

  // Fetch all names
  const fetchAllNames = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search');
      const data = await response.json();
      if (data.success) {
        setAllNames(data.data);
      }
    } catch (error) {
      console.error('Error fetching names:', error);
      toast({
        title: 'Error',
        description: 'Failed to load names from Google Sheet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const [statsRes, dateWiseRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/date-wise'),
      ]);
      
      const statsData = await statsRes.json();
      const dateWiseDataRes = await dateWiseRes.json();
      
      if (statsData.success) setStats(statsData.data);
      if (dateWiseDataRes.success) setDateWiseData(dateWiseDataRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllNames();
    fetchStats();
    fetchExpenses();
  }, [fetchAllNames, fetchStats, fetchExpenses]);

  const getTodayDate = () => new Date().toLocaleDateString('en-GB');

  // Toggle due status
  const toggleDueStatus = async (person: PersonData) => {
    if (person.status === 'Paid') return;
    
    const newStatus = person.status === 'Due' ? '' : 'Due';
    
    try {
      const response = await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: person.rowIndex, status: newStatus }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAllNames(prev => prev.map(p => 
          p.rowIndex === person.rowIndex ? { ...p, status: newStatus } : p
        ));
        fetchStats();
        toast({
          title: newStatus === 'Due' ? 'Marked as Due' : 'Due Removed',
          description: `${person.name} has been ${newStatus === 'Due' ? 'marked as due' : 'removed from due list'}`,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  // Select person for payment
  const handleSelectPerson = (person: PersonData) => {
    setSelectedPerson(person);
    setPaymentAmount(person.fy2627TakaJama || '');
    setGivenAmount(person.givenAmount || '');
    setReturnAmount(person.returnAmount || '');
    setReturnAmountType((person.returnAmountType as 'cash' | 'online') || 'cash');
    setPaymentType((person.paymentType as 'cash' | 'online') || 'cash');
    setPaymentDate(person.paymentDate || getTodayDate());
    setShowPaymentDialog(true);
  };

  // Update payment
  const handleUpdatePayment = async () => {
    if (!selectedPerson) return;
    if (!paymentAmount || paymentAmount.trim() === '') {
      toast({ title: 'Error', description: 'Please enter payment amount', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: selectedPerson.rowIndex,
          amount: paymentAmount,
          paymentType: paymentType,
          paymentDate: paymentDate,
          status: 'Paid',
          givenAmount: givenAmount,
          returnAmount: returnAmount,
          returnAmountType: returnAmountType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowPaymentDialog(false);
        setShowSuccessDialog(true);
        fetchAllNames();
        fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({ title: 'Error', description: 'Failed to update payment', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add new entry
  const handleAddNewEntry = async () => {
    if (!newName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          address: newAddress,
          status: newIsDue ? 'Due' : '',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success!', description: `${newName} has been added` });
        setNewName('');
        setNewAddress('');
        setNewIsDue(false);
        setShowAddDialog(false);
        fetchAllNames();
        fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({ title: 'Error', description: 'Failed to add new entry', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add expense
  const handleAddExpense = async () => {
    if (!expenseDescription.trim() || !expenseAmount) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseDescription,
          amount: expenseAmount,
          date: expenseDate || getTodayDate(),
          paymentType: expensePaymentType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success!', description: 'Expense added successfully' });
        setExpenseDescription('');
        setExpenseAmount('');
        setExpenseDate('');
        setExpensePaymentType('online');
        setShowExpenseDialog(false);
        fetchExpenses();
        fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({ title: 'Error', description: 'Failed to add expense', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Close success dialog
  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    setSelectedPerson(null);
    setPaymentAmount('');
    setGivenAmount('');
    setReturnAmount('');
    setReturnAmountType('cash');
  };

  // Handle login
  const handleLogin = async () => {
    if (!loginId.trim() || !loginPassword.trim()) {
      toast({ title: 'Error', description: 'Please enter ID and Password', variant: 'destructive' });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, password: loginPassword }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLoggedIn(true);
        setShowLoginDialog(false);
        setLoginId('');
        setLoginPassword('');
        toast({ title: 'Success', description: 'Logged in successfully!' });
      } else {
        toast({ title: 'Error', description: data.error || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Error', description: 'Failed to login', variant: 'destructive' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    toast({ title: 'Logged out', description: 'You have been logged out' });
  };

  // Check if user can perform actions
  const canPerformActions = isLoggedIn;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🙏</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">BPUC FY 26-27</h1>
                <p className="text-xs text-orange-100">Hanuman Jayanti</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20 gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs">Logout</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginDialog(true)}
                  className="text-white hover:bg-white/20 gap-1"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-xs">Login</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { fetchAllNames(); fetchStats(); fetchExpenses(); }}
                disabled={isLoading || isStatsLoading}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className={cn("w-5 h-5", (isLoading || isStatsLoading) && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-orange-400/30">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'dashboard' ? "bg-white/20 text-white" : "text-orange-100 hover:bg-white/10"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'collection' ? "bg-white/20 text-white" : "text-orange-100 hover:bg-white/10"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Collection
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'expense' ? "bg-white/20 text-white" : "text-orange-100 hover:bg-white/10"
            )}
          >
            <Receipt className="w-4 h-4" />
            Expense
          </button>
        </div>
      </header>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-4">
            {/* Top Row - 3 Cards Side by Side */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Net Balance */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4" />
                  <p className="text-xs text-green-100">Net Balance</p>
                </div>
                <p className="text-lg font-bold">₹{stats.netBalance.toLocaleString()}</p>
              </div>

              {/* Total Collection */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <p className="text-xs text-orange-100">Collection</p>
                </div>
                <p className="text-lg font-bold">₹{stats.totalCollection.toLocaleString()}</p>
              </div>

              {/* Total Expenses */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="w-4 h-4" />
                  <p className="text-xs text-red-100">Expenses</p>
                </div>
                <p className="text-lg font-bold">₹{stats.totalExpenses.toLocaleString()}</p>
              </div>
            </div>

            {/* Online & Cash */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4" />
                  <p className="text-xs text-blue-100">Online</p>
                </div>
                <p className="text-xl font-bold">₹{stats.onlineCollection.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4" />
                  <p className="text-xs text-emerald-100">Cash</p>
                </div>
                <p className="text-xl font-bold">₹{stats.cashCollection.toLocaleString()}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <Users className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.totalPeople}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <CheckCircle2 className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.paidPeople}</p>
                <p className="text-xs text-gray-500">Paid</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <AlertCircle className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.duePeople}</p>
                <p className="text-xs text-gray-500">Due</p>
              </div>
            </div>

            {/* Date-wise Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Date-wise Collection</h3>
              </div>
              {isStatsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : dateWiseData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No collection data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Total</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Cash</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">Online</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dateWiseData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.date}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">₹{row.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-green-600 text-right">₹{row.cash.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-blue-600 text-right">₹{row.online.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collection Tab */}
      {activeTab === 'collection' && (
        <>
          {/* Filter Buttons */}
          <div className="px-4 py-3 bg-white border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                  filter === 'all' ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                All ({allCount})
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                  filter === 'paid' ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Paid ({paidCount})
              </button>
              <button
                onClick={() => setFilter('due')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                  filter === 'due' ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Due ({dueCount})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-3 bg-white border-b sticky top-[108px] z-40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:border-orange-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-base">No results found</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="px-4 py-2">
                  {searchResults.map((person) => {
                    const isPaid = person.status === 'Paid';
                    const isDuePerson = person.status === 'Due';
                    
                    return (
                      <div
                        key={person.rowIndex}
                        className="w-full mb-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* Due Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleDueStatus(person)}
                            className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                              isPaid 
                                ? "border-gray-300 bg-gray-100 cursor-not-allowed" 
                                : isDuePerson
                                  ? "border-red-500 bg-red-500"
                                  : "border-gray-300 hover:border-red-400"
                            )}
                            disabled={isPaid}
                          >
                            {isDuePerson && !isPaid && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>
                          
                          {/* Clickable area */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!canPerformActions) {
                                toast({ title: 'Login Required', description: 'Please login to update payments', variant: 'destructive' });
                                setShowLoginDialog(true);
                                return;
                              }
                              handleSelectPerson(person);
                            }}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            {/* Avatar */}
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0",
                              isPaid ? "bg-gradient-to-br from-green-400 to-green-500" :
                              isDuePerson ? "bg-gradient-to-br from-red-400 to-red-500" :
                              "bg-gradient-to-br from-orange-400 to-orange-500"
                            )}>
                              {isPaid ? <Check className="w-5 h-5" /> : 
                               isDuePerson ? <AlertCircle className="w-5 h-5" /> :
                               person.name.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
                                <div className="flex items-center gap-1">
                                  {isPaid && person.fy2627TakaJama && (
                                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">₹{person.fy2627TakaJama}</Badge>
                                  )}
                                  {isDuePerson && (
                                    <Badge className="bg-red-100 text-red-700 border-0 text-xs">Due</Badge>
                                  )}
                                </div>
                              </div>
                              {person.address && (
                                <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{person.address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {person.paymentType && (
                                  <Badge variant="outline" className="text-xs">{person.paymentType}</Badge>
                                )}
                                {person.paymentDate && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {person.paymentDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Add New Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={() => {
                if (!canPerformActions) {
                  toast({ title: 'Login Required', description: 'Please login to add new entries', variant: 'destructive' });
                  setShowLoginDialog(true);
                  return;
                }
                setShowAddDialog(true);
              }}
              className={cn(
                "w-14 h-14 rounded-full shadow-lg",
                canPerformActions 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600" 
                  : "bg-gray-400"
              )}
            >
              {canPerformActions ? <Plus className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </Button>
          </div>
        </>
      )}

      {/* Expense Tab */}
      {activeTab === 'expense' && (
        <>
          <div className="flex-1 overflow-hidden">
            {expenses.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-base">No expenses yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="px-4 py-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.rowIndex}
                      className="w-full mb-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {expense.date}
                            {expense.paymentType && (
                              <Badge variant="outline" className="text-xs ml-1">{expense.paymentType}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">₹{expense.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Add Expense Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={() => {
                if (!canPerformActions) {
                  toast({ title: 'Login Required', description: 'Please login to add expenses', variant: 'destructive' });
                  setShowLoginDialog(true);
                  return;
                }
                setExpenseDate(getTodayDate());
                setShowExpenseDialog(true);
              }}
              className={cn(
                "w-14 h-14 rounded-full shadow-lg",
                canPerformActions 
                  ? "bg-gradient-to-r from-red-500 to-red-600" 
                  : "bg-gray-400"
              )}
            >
              {canPerformActions ? <Plus className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </Button>
          </div>
        </>
      )}

      {/* Payment Update Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">Update Payment</DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-4">
            {/* Person Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedPerson?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{selectedPerson?.name}</h3>
                  {selectedPerson?.address && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{selectedPerson.address}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedPerson?.fy2627TakaJama && (
                <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Payment</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">₹{selectedPerson.fy2627TakaJama}</span>
                    {selectedPerson.paymentType && (
                      <Badge variant="outline" className="text-xs">{selectedPerson.paymentType}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Given Amount */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Given Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Enter given amount"
                  value={givenAmount}
                  onChange={(e) => setGivenAmount(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold border-2 rounded-xl focus:border-orange-500"
                />
              </div>
            </div>

            {/* Return Amount */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Return Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Enter return amount"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold border-2 rounded-xl focus:border-orange-500"
                />
              </div>
            </div>

            {/* Return Amount Type */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Return Amount Type</Label>
              <RadioGroup
                value={returnAmountType}
                onValueChange={(value) => setReturnAmountType(value as 'cash' | 'online')}
                className="grid grid-cols-2 gap-2"
              >
                <div className="relative">
                  <RadioGroupItem value="cash" id="return-cash" className="peer sr-only" />
                  <Label htmlFor="return-cash" className="flex items-center justify-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all border-gray-200 bg-white hover:border-orange-300 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-sm">Cash</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="online" id="return-online" className="peer sr-only" />
                  <Label htmlFor="return-online" className="flex items-center justify-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all border-gray-200 bg-white hover:border-orange-300 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-sm">Online</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Amount (Calculated) */}
            <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Amount</span>
                <span className="text-xl font-bold text-green-600">₹{paymentAmount || '0'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Given Amount - Return Amount = Payment Amount</p>
            </div>

            {/* OR Direct Payment Amount */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Or Enter Payment Amount Directly (₹)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Enter amount directly"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    setGivenAmount('');
                    setReturnAmount('');
                  }}
                  className="pl-10 h-12 text-lg font-semibold border-2 rounded-xl focus:border-orange-500"
                />
              </div>
            </div>

            {/* Payment Type */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Payment Type</Label>
              <RadioGroup
                value={paymentType}
                onValueChange={(value) => setPaymentType(value as 'cash' | 'online')}
                className="grid grid-cols-2 gap-2"
              >
                <div className="relative">
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                  <Label htmlFor="cash" className="flex items-center justify-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all border-gray-200 bg-white hover:border-orange-300 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-sm">Cash</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="online" id="online" className="peer sr-only" />
                  <Label htmlFor="online" className="flex items-center justify-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all border-gray-200 bg-white hover:border-orange-300 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-sm">Online</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Date */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Payment Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="pl-10 h-12 border-2 rounded-xl focus:border-orange-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1 h-12 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePayment}
                disabled={isUpdating || !paymentAmount}
                className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><CheckCircle2 className="w-5 h-5 mr-2" /> Update</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Updated!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Payment for <span className="font-semibold">{selectedPerson?.name}</span> has been updated.
          </p>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-left">
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{paymentAmount}</p>
              </div>
              <Badge className="bg-white text-gray-700 border-0 px-3 py-1">
                {paymentType === 'cash' ? <><Banknote className="w-4 h-4 mr-1 inline" /> Cash</> : <><Smartphone className="w-4 h-4 mr-1 inline" /> Online</>}
              </Badge>
            </div>
            <div className="pt-2 border-t border-green-200 flex items-center justify-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {paymentDate}
            </div>
          </div>
          <Button onClick={handleCloseSuccess} className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add New Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Add New Entry
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-orange-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter address (optional)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-orange-500 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <Label className="font-medium text-red-700 cursor-pointer">Mark as Due</Label>
              </div>
              <button
                type="button"
                onClick={() => setNewIsDue(!newIsDue)}
                className={cn(
                  "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                  newIsDue ? "border-red-500 bg-red-500" : "border-gray-300 hover:border-red-400"
                )}
              >
                {newIsDue && <Check className="w-4 h-4 text-white" />}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewName('');
                  setNewAddress('');
                  setNewIsDue(false);
                }}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewEntry}
                disabled={isUpdating || !newName.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-2" /> Add Entry</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">Add Expense</DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                placeholder="Enter expense description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="h-12 border-2 focus:border-red-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount (₹) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-red-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-red-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Type</Label>
              <RadioGroup
                value={expensePaymentType}
                onValueChange={(value) => setExpensePaymentType(value as 'cash' | 'online')}
                className="grid grid-cols-2 gap-2"
              >
                <div className="relative">
                  <RadioGroupItem value="cash" id="expense-cash" className="peer sr-only" />
                  <Label htmlFor="expense-cash" className="flex items-center justify-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all border-gray-200 bg-white hover:border-red-300 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-sm">Cash</span>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="online" id="expense-online" className="peer sr-only" />
                  <Label htmlFor="expense-online" className="flex items-center justify-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all border-gray-200 bg-white hover:border-red-300 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-sm">Online</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExpenseDialog(false);
                  setExpenseDescription('');
                  setExpenseAmount('');
                  setExpenseDate('');
                  setExpensePaymentType('online');
                }}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddExpense}
                disabled={isUpdating || !expenseDescription.trim() || !expenseAmount}
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-2" /> Add Expense</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
            <DialogHeader>
              <DialogTitle className="text-white text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Login Required
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogIn className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600">Enter your credentials to add or update entries</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ID</Label>
              <Input
                type="text"
                placeholder="Enter your ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="h-12 border-2 focus:border-orange-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="h-12 border-2 focus:border-orange-500 rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLoginDialog(false);
                  setLoginId('');
                  setLoginPassword('');
                }}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn || !loginId.trim() || !loginPassword.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
