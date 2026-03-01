import Foundation
import SwiftData

struct SeedData {
    static func loadIfNeeded(context: ModelContext) {
        let taskFetch = FetchDescriptor<TaskItem>()
        let taskCount = (try? context.fetchCount(taskFetch)) ?? 0
        if taskCount == 0 {
            let items = [
            TaskItem(title: "Deep work: thesis outline", detail: "Draft top-level sections", focusMinutesGoal: 45),
            TaskItem(title: "Inbox zero", detail: "Process unread messages", focusMinutesGoal: 25),
            TaskItem(title: "Stretch break", detail: "Mobility routine", focusMinutesGoal: 15)
            ]

            for item in items {
                context.insert(item)
            }
        }

        let habitFetch = FetchDescriptor<HabitAnchor>()
        let habitCount = (try? context.fetchCount(habitFetch)) ?? 0
        if habitCount == 0 {
            let habits = [
                HabitAnchor(anchorHabit: "Brush teeth", newHabit: "Stretch", minimumVersion: "Touch toes", timeOfDay: "morning"),
                HabitAnchor(anchorHabit: "Make tea", newHabit: "Plan day", minimumVersion: "Write 1 priority", timeOfDay: "anytime")
            ]
            for habit in habits {
                context.insert(habit)
            }
        }

        let moodFetch = FetchDescriptor<MoodEntry>()
        let moodCount = (try? context.fetchCount(moodFetch)) ?? 0
        if moodCount == 0 {
            context.insert(MoodEntry(date: Date(), moodScore: 4, note: "Steady and focused"))
        }

        try? context.save()
    }
}
