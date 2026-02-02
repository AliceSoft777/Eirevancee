"use client"

import { useState } from "react"
import { AdminRoute } from "@/components/admin/AdminRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { useStore } from "@/hooks/useStore"
import { useFeedbacks } from "@/hooks/useReviews"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeedbackResponseDialog } from "@/components/admin/FeedbackResponseDialog"
import { formatOrderDate } from "@/lib/order-utils"
import { MessageSquare, AlertCircle } from "lucide-react"

export default function FeedbackListPage() {
  const { feedbacks, updateFeedbackStatus, addFeedbackResponse } = useFeedbacks()
  const { user } = useStore()
  const [respondingTo, setRespondingTo] = useState<{ id: string; subject: string } | null>(null)

  const openTickets = feedbacks.filter(f => f.status === "Open" || f.status === "In Progress")
  const resolvedTickets = feedbacks.filter(f => f.status === "Resolved" || f.status === "Closed")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive"
      case "Medium": return "warning"
      default: return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "destructive"
      case "In Progress": return "warning"
      case "Resolved": return "success"
      default: return "secondary"
    }
  }

  const handleAssign = (feedbackId: string) => {
    updateFeedbackStatus(feedbackId, "In Progress")
  }

  const handleResolve = (feedbackId: string) => {
    updateFeedbackStatus(feedbackId, "Resolved")
  }

  const handleRespond = (feedbackId: string, message: string) => {
    addFeedbackResponse(feedbackId, message, user?.name || "Admin")
    setRespondingTo(null)
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage customer support and feedback</p>
          </div>

          {/* Open Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Active Tickets ({openTickets.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {openTickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No open tickets</p>
              ) : (
                openTickets.map((ticket) => (
                  <div key={ticket.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{ticket.subject}</h4>
                          <Badge variant={getPriorityColor(ticket.priority) as "destructive" | "warning" | "secondary"}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant={getStatusColor(ticket.status) as "destructive" | "warning" | "success" | "secondary"}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ticket.customerName || 'Customer'} ({ticket.customerEmail || ''}) • {formatOrderDate(ticket.createdAt || '')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Category: {ticket.category}
                        </p>
                      </div>
                      {ticket.priority === "High" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    
                    <p className="text-sm mb-3 p-3 bg-accent/10 rounded">{ticket.message}</p>
                    
                    {ticket.responses.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {ticket.responses.map((response) => (
                          <div key={response.id} className="bg-blue-50 p-3 rounded text-sm">
                            <p className="font-semibold text-xs mb-1">
                              {response.respondedBy} • {formatOrderDate(response.timestamp)}
                            </p>
                            <p>{response.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => setRespondingTo(ticket)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                      {ticket.status === "Open" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAssign(ticket.id)}
                        >
                          Assign to me
                        </Button>
                      )}
                      {ticket.status === "In Progress" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResolve(ticket.id)}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Resolved Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Resolved Tickets ({resolvedTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {resolvedTickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No resolved tickets</p>
              ) : (
                <div className="space-y-2">
                  {resolvedTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border border-border rounded">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">{ticket.customerName}</p>
                      </div>
                      <Badge variant="success">Resolved</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response Dialog */}
        {respondingTo && (
          <FeedbackResponseDialog
            isOpen={!!respondingTo}
            feedbackId={respondingTo.id}
            feedbackSubject={respondingTo.subject}
            onSend={handleRespond}
            onCancel={() => setRespondingTo(null)}
          />
        )}
      </AdminLayout>
    </AdminRoute>
  )
}
