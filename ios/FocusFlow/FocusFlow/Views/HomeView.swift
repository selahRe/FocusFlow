import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TaskItem.createdAt, order: .reverse) private var tasks: [TaskItem]
    @Query private var sessions: [FocusSession]
    @State private var showingAdd = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundGradient
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        header
                        statGrid
                        rewardBank
                        taskSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingAdd) {
                TaskEditorView()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today Focus 💪")
                .font(.title)
                .fontWeight(.bold)
            Text(formattedDate())
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 12)
    }

    private var statGrid: some View {
        let minutes = sessions.reduce(0) { $0 + $1.durationMinutes }
        let completed = tasks.filter { $0.isCompleted }.count
        let totalTasks = tasks.count

        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatTile(title: "Focus Minutes", value: "\(minutes) min", subtitle: "Goal 120 min", symbol: "timer", tint: .purple)
            StatTile(title: "Tasks Completed", value: "\(completed)", subtitle: "Total \(totalTasks)", symbol: "checkmark.seal", tint: .green)
        }
    }

    private var rewardBank: some View {
        let rewardMinutes = sessions.count * 5
        let progress = min(Double(rewardMinutes) / 60.0, 1.0)

        return SectionCard(title: "Reward Bank") {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Available reward")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(rewardMinutes) min")
                        .font(.headline)
                }

                ProgressView(value: progress)
                    .tint(.purple)
                    .background(Color.white.opacity(0.4))

                Text("Complete focus sessions to earn reward time.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var taskSection: some View {
        SectionCard(title: "Today Tasks") {
            HStack {
                Text("Start with your top priorities")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Button {
                    showingAdd = true
                } label: {
                    Label("New Task", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
            }

            if tasks.isEmpty {
                EmptyStateView(title: "No tasks yet", message: "Add a goal to start your day.")
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

    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "MMM d, EEEE"
        return formatter.string(from: Date())
    }
}

private struct StatTile: View {
    let title: String
    let value: String
    let subtitle: String
    let symbol: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: symbol)
                    .foregroundStyle(tint)
                    .frame(width: 28, height: 28)
                    .background(tint.opacity(0.15))
                    .clipShape(Circle())
                Spacer()
            }

            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(Color.white.opacity(0.75))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}
