import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.backgroundGradient
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        header
                        SectionCard(title: "Focus") {
                            VStack(spacing: 12) {
                                NavigationLink {
                                    RemindersView()
                                } label: {
                                    SettingsRow(title: "Reminders", subtitle: "Focus session alerts")
                                }

                                NavigationLink {
                                    ExportView()
                                } label: {
                                    SettingsRow(title: "Export Data", subtitle: "Download JSON archive")
                                }
                            }
                        }

                        SectionCard(title: "About") {
                            HStack {
                                Text("Version")
                                Spacer()
                                Text("1.0")
                                    .foregroundStyle(.secondary)
                            }

                            Link("Support", destination: URL(string: "https://developer.apple.com")!)
                                .font(.subheadline)
                        }
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
            Text("Settings")
                .font(.title)
                .fontWeight(.bold)
            Text("Customize your focus flow.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 12)
    }
}

private struct SettingsRow: View {
    let title: String
    let subtitle: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(Color.white.opacity(0.7))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
