import { Project, ScheduledEvent, ScheduledEventType, Task } from "@stridetime/types";
import { DailyPlanner } from "@stridetime/ui";
import { useState } from "react";


// Mock data
const mockProjects: Project[] = [
  {
    id: "proj-1",
    workspaceId: "ws-1",
    userId: "user-1",
    name: "Website Redesign",
    description: "Complete redesign of company website",
    color: "#3b82f6",
    icon: "🎨",
    status: "ACTIVE",
    completionPercentage: 45,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "proj-2",
    workspaceId: "ws-1",
    userId: "user-1",
    name: "Mobile App",
    description: "iOS and Android app development",
    color: "#10b981",
    icon: "📱",
    status: "ACTIVE",
    completionPercentage: 30,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "proj-3",
    workspaceId: "ws-1",
    userId: "user-1",
    name: "Marketing Campaign",
    description: "Q1 marketing initiatives",
    color: "#f59e0b",
    icon: "📢",
    status: "ACTIVE",
    completionPercentage: 60,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    userId: "user-1",
    projectId: "proj-1",
    parentTaskId: null,
    title: "Design homepage mockup",
    description: "Create high-fidelity mockup for new homepage",
    difficulty: "MEDIUM",
    priority: "HIGH",
    progress: 0,
    status: "IN_PROGRESS",
    assigneeUserId: null,
    teamId: null,
    estimatedMinutes: 120,
    maxMinutes: null,
    actualMinutes: 0,
    plannedForDate: new Date().toISOString().split("T")[0],
    dueDate: null,
    taskTypeId: null,
    displayOrder: 0,
    tags: null,
    externalId: null,
    externalSource: null,
    completedAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "task-2",
    userId: "user-1",
    projectId: "proj-2",
    parentTaskId: null,
    title: "Implement user authentication",
    description: "Add OAuth and JWT authentication",
    difficulty: "HARD",
    priority: "CRITICAL",
    progress: 0,
    status: "IN_PROGRESS",
    assigneeUserId: null,
    teamId: null,
    estimatedMinutes: 180,
    maxMinutes: null,
    actualMinutes: 0,
    plannedForDate: new Date().toISOString().split("T")[0],
    dueDate: null,
    taskTypeId: null,
    displayOrder: 1,
    tags: null,
    externalId: null,
    externalSource: null,
    completedAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "task-3",
    userId: "user-1",
    projectId: "proj-1",
    parentTaskId: null,
    title: "Write blog post",
    description: "Content for product launch announcement",
    difficulty: "EASY",
    priority: "MEDIUM",
    progress: 0,
    status: "IN_PROGRESS",
    assigneeUserId: null,
    teamId: null,
    estimatedMinutes: 90,
    maxMinutes: null,
    actualMinutes: 0,
    plannedForDate: new Date().toISOString().split("T")[0],
    dueDate: null,
    taskTypeId: null,
    displayOrder: 2,
    tags: null,
    externalId: null,
    externalSource: null,
    completedAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "task-4",
    userId: "user-1",
    projectId: "proj-3",
    parentTaskId: null,
    title: "Review analytics report",
    description: "Analyze Q4 performance metrics",
    difficulty: "MEDIUM",
    priority: "LOW",
    progress: 0,
    status: "IN_PROGRESS",
    assigneeUserId: null,
    teamId: null,
    estimatedMinutes: 60,
    maxMinutes: null,
    actualMinutes: 0,
    plannedForDate: new Date().toISOString().split("T")[0],
    dueDate: null,
    taskTypeId: null,
    displayOrder: 3,
    tags: null,
    externalId: null,
    externalSource: null,
    completedAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
];

const mockScheduledEvents: ScheduledEvent[] = [
  {
    id: "event-1",
    taskId: null,
    userId: "user-1",
    startTime: "09:00",
    durationMinutes: 30,
    label: "Engineering Standup",
    type: ScheduledEventType.MEETING,
    externalId: "gcal_standup_7x3k",
    externalSource: "GOOGLE_CALENDAR",
    metadata: JSON.stringify({
      calendarName: "Work",
      organizer: { name: "Sarah Chen", email: "sarah.chen@stride.com" },
      attendees: [
        { name: "Jaren Moore", email: "jaren@stride.com", responseStatus: "accepted" },
        { name: "Sarah Chen", email: "sarah.chen@stride.com", responseStatus: "accepted" },
        { name: "Marcus Johnson", email: "marcus.j@stride.com", responseStatus: "accepted" },
        { name: "Emily Rodriguez", email: "emily.r@stride.com", responseStatus: "tentative" },
      ],
      location: "Google Meet",
      description:
        "Daily standup — what did you do yesterday, what are you doing today, any blockers?\n\nKeep it to 15 minutes.",
      htmlLink: "https://calendar.google.com/calendar/event?eid=standup123",
      hangoutLink: "https://meet.google.com/xyz-uvwq-rst",
      status: "confirmed",
    }),
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "event-2",
    taskId: null,
    userId: "user-1",
    startTime: "12:00",
    durationMinutes: 60,
    label: "Lunch Break",
    type: ScheduledEventType.BREAK,
    externalId: null,
    externalSource: null,
    metadata: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
  {
    id: "event-3",
    taskId: null,
    userId: "user-1",
    startTime: "14:00",
    durationMinutes: 60,
    label: "Q2 Planning Sync",
    type: ScheduledEventType.MEETING,
    externalId: "gcal_q2plan_9a2z",
    externalSource: "GOOGLE_CALENDAR",
    metadata: JSON.stringify({
      calendarName: "Work",
      organizer: { name: "Jaren Moore", email: "jaren@stride.com" },
      attendees: [
        { name: "Jaren Moore", email: "jaren@stride.com", responseStatus: "accepted" },
        { name: "Sarah Chen", email: "sarah.chen@stride.com", responseStatus: "accepted" },
        { name: "Marcus Johnson", email: "marcus.j@stride.com", responseStatus: "accepted" },
        { name: "Emily Rodriguez", email: "emily.r@stride.com", responseStatus: "tentative" },
        { name: "David Park", email: "david.park@stride.com", responseStatus: "needsAction" },
      ],
      location: "Google Meet",
      description: [
        "Q2 roadmap planning and feature prioritization.",
        "",
        "Agenda:",
        "1. Review Q1 retrospective outcomes (10 min)",
        "2. Q2 goal setting & OKRs (20 min)",
        "3. Feature prioritization — dot voting (20 min)",
        "4. Resource planning & capacity (10 min)",
        "",
        "Prep: review the Q2 proposal doc before the meeting.",
        "Doc: https://docs.stride.com/q2-planning-2024",
      ].join("\n"),
      htmlLink: "https://calendar.google.com/calendar/event?eid=q2plan456",
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      status: "confirmed",
    }),
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deleted: false,
  },
];

export function WeeklyPlanner() {
  const [date, setDate] = useState(new Date());
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>(mockScheduledEvents);
  const [plannedTasks] = useState<Task[]>(mockTasks);

  const handleScheduleTask = (taskId: string, startTime: string, durationMinutes: number) => {
    console.log("handleScheduleTask called:", { taskId, startTime, durationMinutes });
    const newEvent: ScheduledEvent = {
      id: `event-${Date.now()}`,
      taskId,
      userId: "user-1",
      startTime,
      durationMinutes,
      label: plannedTasks.find((t) => t.id === taskId)?.title || "Task",
      type: ScheduledEventType.TASK,
      externalId: null,
      externalSource: null,
      metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    console.log("Creating new event:", newEvent);
    setScheduledEvents((prev) => {
      const updated = [...prev, newEvent];
      console.log("Updated scheduledEvents:", updated);
      return updated;
    });
  };

  const handleMoveEvent = (eventId: string, newStartTime: string) => {
    setScheduledEvents((prev) => {
      return prev.map((e) => (e.id === eventId ? { ...e, startTime: newStartTime } : e));
    });
  };

  const handleResizeEvent = (eventId: string, newDurationMinutes: number) => {
    setScheduledEvents((prev) => {
     return prev.map((e) =>
        e.id === eventId ? { ...e, durationMinutes: newDurationMinutes } : e
      );
    });
  };

  const handleRemoveEvent = (eventId: string) => {
    setScheduledEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleEditEvent = (
    eventId: string,
    updates: {
      label?: string | undefined;
      startTime?: string | undefined;
      durationMinutes?: number | undefined;
      type?: any;
    }
  ) => {
    setScheduledEvents((prev) => {
      return prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e));
    });
  };

  const handleAddEvent = (event: {
    label: string;
    startTime: string;
    durationMinutes: number;
    type: any;
    recurring: boolean;
  }) => {
    const newEvent: ScheduledEvent = {
      id: `event-${Date.now()}`,
      taskId: null,
      userId: "user-1",
      startTime: event.startTime,
      durationMinutes: event.durationMinutes,
      label: event.label,
      type: event.type,
      externalId: null,
      externalSource: null,
      metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    setScheduledEvents((prev) => [...prev, newEvent]);
  };

  return (
    <div className="h-screen">
      <DailyPlanner
        date={date}
        scheduledEvents={scheduledEvents}
        plannedTasks={plannedTasks}
        tasks={mockTasks}
        projects={mockProjects}
        onDateChange={setDate}
        onScheduleTask={handleScheduleTask}
        onMoveEvent={handleMoveEvent}
        onResizeEvent={handleResizeEvent}
        onRemoveEvent={handleRemoveEvent}
        onEditEvent={handleEditEvent}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}
