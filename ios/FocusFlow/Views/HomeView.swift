import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TaskItem.createdAt, order: .reverse) private var tasks: [TaskItem]
    @Query private var sessions: [FocusSession]
    @Query(sort: \MoodEntry.date, order: .reverse) private var moods: [MoodEntry]

    @State private var showingAdd = false
    @State private var showingMood = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundGradient
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        header
                        statRow
                        quickActions
                        taskSection
                        moodSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingAdd) {
                TaskEditorView()
            }
            .sheet(isPresented: $showingMood) {
                MoodCheckinView()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today Focus")
                .font(.title)
                .fontWeight(.bold)
            Text(Date(), style: .date)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 12)
    }

    private var statRow: some View {
        let minutes = sessions.reduce(0) { $0 + $1.durationMinutes }
        let completed = tasks.filter { $0.isCompleted }.count

        return VStack(spacing: 12) {
            StatPill(title: "Focus Minutes", value: "\(minutes)", symbol: "timer", tint: .purple)
            StatPill(title: "Tasks Completed", value: "\(completed)", symbol: "checkmark.seal", tint: .green)
        }
    }

    private var quickActions: some View {
        SectionCard(title: "Quick Start") {
            HStack(spacing: 12) {
                Button {
                    showingAdd = true
                } label: {
                    Label("New Task", systemImage: "plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                NavigationLink {
                    FocusTimerView(task: nil)
                } label: {
                    Label("Focus", systemImage: "timer")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
    }

    private var taskSection: some View {
        SectionCard(title: "Today Tasks") {
            if tasks.isEmpty {
                EmptyStateView(title: "No tasks yet", message: "Add a focus goal to get started.")
            } else {
                ForEach(tasks.prefix(3)) { task in
                    NavigationLink {
                        TaskDetailView(task: task)
                    } label: {
                        HStack {
                            Text(task.title)
                                .font(.body)
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 6)
                    }
                }

                NavigationLink("View all tasks") {
                    TaskListView()
                }
                .font(.footnote)
            }
        }
    }

    private var moodSection: some View {
        let recentMood = moods.first

        return SectionCard(title: "Mood Check-in") {
            VStack(alignment: .leading, spacing: 8) {
                if let recentMood {
                    Text("Last mood: \(recentMood.moodScore)/5")
                        .font(.headline)
                    if !recentMood.note.isEmpty {
                        Text(recentMood.note)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Text("How are you feeling today?")
                        .font(.headline)
                }

                Button("Log Mood") {
                    showingMood = true
                }
                .buttonStyle(.bordered)
            }
        }
    }
}
