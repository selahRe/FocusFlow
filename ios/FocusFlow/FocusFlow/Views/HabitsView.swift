import SwiftUI
import SwiftData

struct HabitsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \HabitAnchor.createdAt, order: .reverse) private var habits: [HabitAnchor]

    @State private var showingAdd = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundGradient
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        header
                        progressCard
                        if habits.isEmpty {
                            EmptyStateView(title: "No habit anchors", message: "Attach new habits to existing routines.")
                        } else {
                            ForEach(habits) { habit in
                                HabitRow(habit: habit, onToggle: toggleHabit, onDelete: deleteHabit)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
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
                HabitEditorView()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Habit Anchors")
                .font(.title)
                .fontWeight(.bold)
            Text("Stack a new habit onto an existing one.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 12)
    }

    private var progressCard: some View {
        let completed = habits.filter { $0.completedToday }.count
        return SectionCard(title: "Today") {
            HStack {
                Text("Completed")
                Spacer()
                Text("\(completed)/\(habits.count)")
                    .font(.headline)
            }
        }
    }

    private func toggleHabit(_ habit: HabitAnchor) {
        let today = Calendar.current.startOfDay(for: Date())
        if habit.lastCompletedDate == today {
            habit.completedToday = false
            habit.streak = max(habit.streak - 1, 0)
        } else {
            let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)
            if habit.lastCompletedDate == yesterday {
                habit.streak += 1
            } else {
                habit.streak = 1
            }
            habit.lastCompletedDate = today
            habit.completedToday = true
        }
        try? modelContext.save()
    }

    private func deleteHabit(_ habit: HabitAnchor) {
        modelContext.delete(habit)
        try? modelContext.save()
    }
}

private struct HabitRow: View {
    let habit: HabitAnchor
    let onToggle: (HabitAnchor) -> Void
    let onDelete: (HabitAnchor) -> Void

    var body: some View {
        SectionCard(title: habit.newHabit) {
            VStack(alignment: .leading, spacing: 8) {
                Text("After \(habit.anchorHabit) -> \(habit.minimumVersion)")
                    .font(.subheadline)
                HStack {
                    Text(habit.timeOfDay.capitalized)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("Streak \(habit.streak)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                HStack(spacing: 12) {
                    Button(habit.completedToday ? "Done" : "Mark Done") {
                        onToggle(habit)
                    }
                    .buttonStyle(.borderedProminent)

                    Button("Delete", role: .destructive) {
                        onDelete(habit)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }
}

private struct HabitEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var anchor = ""
    @State private var newHabit = ""
    @State private var minimum = ""
    @State private var timeOfDay = "anytime"
    @State private var isGenerating = false
    @State private var aiError: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Anchor") {
                    TextField("Existing habit", text: $anchor)
                }
                Section("New Habit") {
                    TextField("Desired habit", text: $newHabit)
                }
                Section("Minimum Version") {
                    TextField("Smallest action", text: $minimum)

                    Button(isGenerating ? "Generating..." : "Generate with AI") {
                        generateMinimum()
                    }
                    .disabled(isGenerating || newHabit.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    if let aiError {
                        Text(aiError)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Section("Time of Day") {
                    Picker("Time", selection: $timeOfDay) {
                        Text("Morning").tag("morning")
                        Text("Afternoon").tag("afternoon")
                        Text("Evening").tag("evening")
                        Text("Anytime").tag("anytime")
                    }
                }
            }
            .navigationTitle("New Habit")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") { saveHabit() }
                        .disabled(anchor.isEmpty || newHabit.isEmpty || minimum.isEmpty)
                }
            }
        }
    }

    private func saveHabit() {
        let habit = HabitAnchor(anchorHabit: anchor, newHabit: newHabit, minimumVersion: minimum, timeOfDay: timeOfDay)
        modelContext.insert(habit)
        try? modelContext.save()
        dismiss()
    }

    private func generateMinimum() {
        aiError = nil
        isGenerating = true

        Task {
            let result = await AIHabitAssistant.shared.generateMinimumVersion(for: newHabit)
            await MainActor.run {
                minimum = result
                isGenerating = false
                if result.isEmpty {
                    aiError = "AI unavailable. Enter a minimum version manually."
                }
            }
        }
    }
}
