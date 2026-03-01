import Foundation
import UserNotifications

struct ReminderScheduler {
    static func requestAuthorization() async {
        let center = UNUserNotificationCenter.current()
        _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    static func schedule(reminder: ReminderItem) async {
        let center = UNUserNotificationCenter.current()
        let content = UNMutableNotificationContent()
        content.title = "FocusFlow"
        content.body = reminder.title
        content.sound = .default

        let calendar = Calendar.current
        var components = calendar.dateComponents([.hour, .minute], from: reminder.time)

        if reminder.repeatWeekdays.isEmpty {
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(identifier: reminder.id.uuidString, content: content, trigger: trigger)
            try? await center.add(request)
        } else {
            for weekday in reminder.repeatWeekdays {
                components.weekday = weekday
                let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
                let id = "\(reminder.id.uuidString)-\(weekday)"
                let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
                try? await center.add(request)
            }
        }
    }

    static func cancel(reminder: ReminderItem) {
        let center = UNUserNotificationCenter.current()
        let base = reminder.id.uuidString
        if reminder.repeatWeekdays.isEmpty {
            center.removePendingNotificationRequests(withIdentifiers: [base])
        } else {
            let ids = reminder.repeatWeekdays.map { "\(base)-\($0)" }
            center.removePendingNotificationRequests(withIdentifiers: ids)
        }
    }
}
