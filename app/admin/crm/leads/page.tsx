"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/admin/EmptyState"
import { Pagination } from "@/components/admin/Pagination"
import { usePagination } from "@/hooks/usePagination"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { toast } from "sonner"
import { Search, Plus, Eye, Trash2, Loader2, Users2, AlertCircle } from "lucide-react"

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  source: string
  message: string | null
  status: string
  next_follow_up_date: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  Quoted: "bg-purple-100 text-purple-800",
  Converted: "bg-green-100 text-green-800",
}

export default function LeadsListPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", message: "", source: "manual" })
  const [isAdding, setIsAdding] = useState(false)

  // Follow-up due today or overdue
  const followUpsDue = useMemo(() =>
    leads.filter(l => l.next_follow_up_date && l.status !== "Converted" &&
      new Date(l.next_follow_up_date) <= new Date()
    ).length
  , [leads])

  useEffect(() => { fetchLeads() }, [])

  const fetchLeads = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/admin/crm/leads", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLeads(data.leads ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load leads")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone && l.phone.includes(searchTerm))
      const matchesStatus = statusFilter === "all" || l.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [leads, searchTerm, statusFilter])

  const { currentPage, totalPages, goToPage, startIndex, endIndex, itemsPerPage } = usePagination({
    totalItems: filteredLeads.length,
    itemsPerPage: 10,
  })

  useEffect(() => { goToPage(1) }, [searchTerm, statusFilter, goToPage])

  const currentLeads = filteredLeads.slice(startIndex, endIndex)

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLeads(prev => prev.filter(l => l.id !== deleteId))
      toast.success("Lead deleted")
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lead")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddLead = async () => {
    if (!addForm.name || !addForm.email) {
      toast.error("Name and email are required")
      return
    }
    setIsAdding(true)
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLeads(prev => [data.lead, ...prev])
      toast.success("Lead created")
      setShowAddModal(false)
      setAddForm({ name: "", email: "", phone: "", message: "", source: "manual" })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create lead")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">CRM — Leads</h1>
          <p className="text-muted-foreground mt-1">Manage and track all sales leads</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="neu-raised border-transparent text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      {/* Follow-up alert */}
      {followUpsDue > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-400/40 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {followUpsDue} lead{followUpsDue !== 1 ? "s" : ""} with overdue follow-up
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Quoted">Quoted</SelectItem>
            <SelectItem value="Converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No leads found"
              description={searchTerm || statusFilter !== "all" ? "Try adjusting your filters." : "Leads from the contact form will appear here."}
              actionLabel={searchTerm || statusFilter !== "all" ? "Clear Filters" : undefined}
              onAction={() => { setSearchTerm(""); setStatusFilter("all") }}
            />
          ) : (
            <>
              <div className="space-y-3">
                {currentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{lead.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                        {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}`}>
                          {lead.status}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{lead.source}</span>
                        {lead.next_follow_up_date && (
                          <span className={`text-xs ${new Date(lead.next_follow_up_date) <= new Date() ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                            Follow-up: {format(new Date(lead.next_follow_up_date), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/crm/leads/${lead.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(lead.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  totalItems={filteredLeads.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={open => !isAdding && setShowAddModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Lead Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="+353 xx xxx xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={addForm.source} onValueChange={v => setAddForm(p => ({ ...p, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Message / Notes</Label>
              <Textarea value={addForm.message} onChange={e => setAddForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="What are they looking for?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isAdding}>Cancel</Button>
            <Button onClick={handleAddLead} disabled={isAdding} className="neu-raised border-transparent text-white">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        title="Delete Lead"
        description="Are you sure you want to permanently delete this lead?"
        itemName="lead"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
