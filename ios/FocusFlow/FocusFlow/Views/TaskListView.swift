import SwiftUI
import SwiftData

struct TaskListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TaskItem.createdAt, order: .reverse) private var tasks: [TaskItem]
    @State private var showingAdd = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(tasks) { task in
                    NavigationLink(value: task) {
                        TaskRow(task: task)
                    }
                }
                .onDelete(perform: deleteTasks)
            }
            .navigationTitle("Tasks")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .navigationDestination(for: TaskItem.self) { task in
                TaskDetailView(task: task)
            }
            .sheet(isPresented: $showingAdd) {
                TaskEditorView()
            }
        }
    }

    private func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(tasks[index])
        }
        try? modelContext.save()
    }
}

private struct TaskRow: View {
    @Bindable var task: TaskItem

    var body: some View {
        HStack {
            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(task.isCompleted ? .green : .secondary)
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.headline)
                if !task.detail.isEmpty {
                    Text(task.detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Text("\(task.focusMinutesGoal)m")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct TaskEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var title = ""
    @State private var detail = ""
    @State private var goalMinutes = 25
    @State private var useAI = true
    @State private var isGenerating = false
    @State private var aiError: String?
    @State private var drafts: [SubtaskDraft] = []

    var body: some View {
        NavigationStack {
            Form {
                Section("Title") {
                    TextField("Task title", text: $title)
                }
                Section("Notes") {
                    TextField("Optional detail", text: $detail)
                }
                Section("Focus Goal") {
                    Stepper("\(goalMinutes) minutes", value: $goalMinutes, in: 10...120, step: 5)
                }
                Section("AI Plan") {
                    Toggle("Use AI planning", isOn: $useAI)
                        .disabled(isGenerating)

                    Button(isGenerating ? "Generating..." : "Generate Subtasks") {
                        generateSubtasks()
                    }
                    .disabled(!useAI || isGenerating || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    if let aiError {
                        Text(aiError)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if drafts.isEmpty {
                        Text("No subtasks yet")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(drafts) { draft in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(draft.title)
                                    .font(.subheadline)
                                Text("\(draft.durationMinutes) min • reward \(draft.rewardMinutes) min")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("New Task")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") { saveTask() }
                        .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func saveTask() {
        if useAI && drafts.isEmpty && !isGenerating {
            generateSubtasks(saveAfter: true)
            return
        }
        persistTask()
    }

    private func generateSubtasks(saveAfter: Bool = false) {
        aiError = nil
        isGenerating = true

        Task {
            let result = await AIPlanner.shared.generateSubtasks(
                title: title,
                detail: detail,
                goalMinutes: goalMinutes
            )
            await MainActor.run {
                drafts = result
                aiError = result.isEmpty ? "AI unavailable. A simple plan will be used." : nil
                isGenerating = false
                if saveAfter {
                    persistTask()
                }
            }
        }
    }

    private func persistTask() {
        let item = TaskItem(title: title, detail: detail, focusMinutesGoal: goalMinutes)
        if !drafts.isEmpty {
            for (index, draft) in drafts.enumerated() {
                let subtask = SubtaskItem(
                    title: draft.title,
                    durationMinutes: draft.durationMinutes,
                    rewardMinutes: draft.rewardMinutes,
                    order: index
                )
                item.subtasks.append(subtask)
            }
        }
        modelContext.insert(item)
        try? modelContext.save()
        dismiss()
    }
}
