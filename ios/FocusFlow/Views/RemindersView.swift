import SwiftUI
import SwiftData

struct RemindersView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \ReminderItem.createdAt, order: .reverse) private var reminders: [ReminderItem]

    @State private var showingAdd = false

    var body: some View {
        List {
            ForEach(reminders) { reminder in
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(reminder.title)
                            .font(.headline)
                        Text(reminder.time, style: .time)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("", isOn: Binding(
                        get: { reminder.isEnabled },
                        set: { newValue in
                            reminder.isEnabled = newValue
                            if newValue {
                                Task { await ReminderScheduler.schedule(reminder: reminder) }
                            } else {
                                ReminderScheduler.cancel(reminder: reminder)
                            }
                            try? modelContext.save()
                        }
                    ))
                    .labelsHidden()
                }
            }
            .onDelete(perform: deleteReminders)
        }
        .navigationTitle("Reminders")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingAdd = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAdd) {
            ReminderEditorView()
        }
        .task {
            await ReminderScheduler.requestAuthorization()
        }
    }

    private func deleteReminders(at offsets: IndexSet) {
        for index in offsets {
            let item = reminders[index]
            ReminderScheduler.cancel(reminder: item)
            modelContext.delete(item)
        }
        try? modelContext.save()
    }
}

private struct ReminderEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var title = "Focus reminder"
    @State private var time = Date()

    var body: some View {
        NavigationStack {
            Form {
                Section("Title") {
                    TextField("Reminder", text: $title)
                }
                Section("Time") {
                    DatePicker("Time", selection: $time, displayedComponents: .hourAndMinute)
                }
            }
            .navigationTitle("New Reminder")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") { saveReminder() }
                }
            }
        }
    }

    private func saveReminder() {
        let reminder = ReminderItem(title: title, time: time)
        modelContext.insert(reminder)
        try? modelContext.save()
        Task { await ReminderScheduler.schedule(reminder: reminder) }
        dismiss()
    }
}
