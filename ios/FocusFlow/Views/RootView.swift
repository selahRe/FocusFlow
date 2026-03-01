import SwiftUI
import SwiftData

struct RootView: View {
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house") }

            FocusTimerView(task: nil)
                .tabItem { Label("Focus", systemImage: "timer") }

            HabitsView()
                .tabItem { Label("Habits", systemImage: "link") }

            StatsView()
                .tabItem { Label("Stats", systemImage: "chart.bar") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "slider.horizontal.3") }
        }
        .task {
            SeedData.loadIfNeeded(context: modelContext)
        }
    }
}
