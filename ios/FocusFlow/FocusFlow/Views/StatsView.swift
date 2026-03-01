import SwiftUI
import SwiftData

struct StatsView: View {
    @Query private var tasks: [TaskItem]
    @Query private var sessions: [FocusSession]
    @Query private var moods: [MoodEntry]

    var body: some View {
        let summary = StatsCalculator.summarize(tasks: tasks, sessions: sessions)
        let averageMood = moods.isEmpty ? 0 : moods.reduce(0) { $0 + $1.moodScore } / moods.count

        NavigationStack {
            ZStack {
                AppTheme.backgroundGradient
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        header
                        StatPill(title: "Focus Minutes", value: "\(summary.totalMinutes)", symbol: "timer", tint: .purple)
                        StatPill(title: "Sessions", value: "\(summary.totalSessions)", symbol: "bolt", tint: .blue)
                        StatPill(title: "Completed Tasks", value: "\(summary.completedTasks)", symbol: "checkmark.seal", tint: .green)
                        StatPill(title: "Average Mood", value: "\(averageMood)/5", symbol: "face.smiling", tint: .orange)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Stats")
                .font(.title)
                .fontWeight(.bold)
            Text("Track your focus rhythm.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 12)
    }
}
