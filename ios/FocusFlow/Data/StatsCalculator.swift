import Foundation

struct StatsCalculator {
    static func summarize(tasks: [TaskItem], sessions: [FocusSession]) -> StatsSummary {
        let totalMinutes = sessions.reduce(0) { $0 + $1.durationMinutes }
        let completedTasks = tasks.filter { $0.isCompleted }.count
        let activeTasks = tasks.count - completedTasks
        return StatsSummary(
            totalSessions: sessions.count,
            totalMinutes: totalMinutes,
            completedTasks: completedTasks,
            activeTasks: activeTasks
        )
    }
}
