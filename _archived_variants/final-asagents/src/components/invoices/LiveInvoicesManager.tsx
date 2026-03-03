import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Plus,
  Trash2,
  Eye,
  DollarSign,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import backendApi, { Invoice, Project } from '../../services/backendApi';

interface InvoiceFilters {
  search: string;
  status: string;
  date_from: string;
  date_to: string;
  sort: string;
  order: 'asc' | 'desc';
}

interface InvoiceFormData {
  project_id: string;
  client_id: string;
  due_date: string;
  notes: string;
  items: Array<{
    description: string;
    quantity: string;
    unit_price: string;
  }>;
}

export default function LiveInvoicesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
    sort: 'created_at',
    order: 'desc'
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [summary, setSummary] = useState({
    total_invoices: 0,
    total_amount: 0,
    total_paid: 0,
    draft_count: 0,
    sent_count: 0,
    paid_count: 0,
    overdue_count: 0
  });

  // Form state for creating invoices
  const [formData, setFormData] = useState<InvoiceFormData>({
    project_id: '',
    client_id: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: '1', unit_price: '0' }]
  });

  // Load invoices with filters
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 20,
        sort: filters.sort,
        order: filters.order
      };

      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const [invoicesResponse, summaryResponse] = await Promise.all([
        backendApi.getInvoices(params),
        backendApi.getInvoiceSummary()
      ]);

      setInvoices(invoicesResponse.invoices);
      setMeta(invoicesResponse.meta);
      setSummary(summaryResponse);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load projects for dropdown
  const loadProjects = async () => {
    try {
      const response = await backendApi.getProjects({ limit: 100 });
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(loadInvoices, 300);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle form input changes
  const handleFormChange = (key: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Handle invoice item changes
  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new invoice item
  const addInvoiceItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: '1', unit_price: '0' }]
    }));
  };

  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Create new invoice
  const handleCreateInvoice = async () => {
    try {
      const invoiceData = {
        project_id: formData.project_id || undefined,
        client_id: formData.client_id,
        due_date: formData.due_date,
        notes: formData.notes || undefined,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      const newInvoice = await backendApi.createInvoice(invoiceData);
      setInvoices(prev => [newInvoice, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      loadInvoices(); // Refresh to update summary
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      project_id: '',
      client_id: '',
      due_date: '',
      notes: '',
      items: [{ description: '', quantity: '1', unit_price: '0' }]
    });
  };

  // Update invoice status
  const handleUpdateInvoiceStatus = async (invoice: Invoice, status: string) => {
    try {
      const updatedInvoice = await backendApi.updateInvoice(invoice.id, { status });
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
      loadInvoices(); // Refresh to update summary
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) return;

    try {
      await backendApi.deleteInvoice(invoice.id);
      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      loadInvoices(); // Refresh to update summary
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  // View invoice details
  const viewInvoiceDetails = async (invoice: Invoice) => {
    try {
      const detailedInvoice = await backendApi.getInvoice(invoice.id);
      setSelectedInvoice(detailedInvoice);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Failed to load invoice details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'draft': return 'outline';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateItemTotal = (quantity: string, unitPrice: string) => {
    return parseFloat(quantity) * parseFloat(unitPrice);
  };

  const calculateInvoiceTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity, item.unit_price);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            {meta.total} total invoices • {formatCurrency(summary.total_amount)} total value
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select value={formData.project_id} onValueChange={(value) => handleFormChange('project_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleFormChange('due_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Invoice Items</Label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={`item-${index}-${item.description || 'new'}`} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">
                          ${calculateItemTotal(item.quantity, item.unit_price).toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-1">
                        {formData.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvoiceItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(calculateInvoiceTotal())}</span>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.total_paid)} collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.paid_count}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_invoices > 0 ? Math.round((summary.paid_count / summary.total_invoices) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.sent_count}</div>
            <p className="text-xs text-muted-foreground">
              Sent and awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overdue_count}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-[150px]"
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-[150px]"
            />
            <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="invoice_number">Number</SelectItem>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="total_amount">Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <h4 className="font-medium">{invoice.invoice_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client_name} • Due {formatDate(invoice.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                      <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => viewInvoiceDetails(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateInvoiceStatus(invoice, 'sent')}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.status === 'sent' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateInvoiceStatus(invoice, 'paid')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.status === 'draft' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="font-medium">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <Label>Client</Label>
                  <p className="font-medium">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <Label>Items</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Description</th>
                          <th className="text-right p-3">Qty</th>
                          <th className="text-right p-3">Unit Price</th>
                          <th className="text-right p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-3">{item.description}</td>
                            <td className="text-right p-3">{item.quantity}</td>
                            <td className="text-right p-3">{formatCurrency(item.unit_price)}</td>
                            <td className="text-right p-3">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
