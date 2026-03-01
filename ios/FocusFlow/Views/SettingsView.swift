import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Focus") {
                    NavigationLink("Reminders") { RemindersView() }
                    NavigationLink("Export Data") { ExportView() }
                }

                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0")
                            .foregroundStyle(.secondary)
                    }
                    Link("Support", destination: URL(string: "https://developer.apple.com")!)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
