import Foundation
import SwiftData

@Model
final class HabitAnchor {
    @Attribute(.unique) var id: UUID
    var anchorHabit: String
    var newHabit: String
    var minimumVersion: String
    var timeOfDay: String
    var streak: Int
    var lastCompletedDate: Date?
    var completedToday: Bool
    var createdAt: Date

    init(anchorHabit: String, newHabit: String, minimumVersion: String, timeOfDay: String) {
        self.id = UUID()
        self.anchorHabit = anchorHabit
        self.newHabit = newHabit
        self.minimumVersion = minimumVersion
        self.timeOfDay = timeOfDay
        self.streak = 0
        self.lastCompletedDate = nil
        self.completedToday = false
        self.createdAt = Date()
    }
}
