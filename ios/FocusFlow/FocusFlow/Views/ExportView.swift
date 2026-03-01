import SwiftUI
import SwiftData

struct ExportView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var exportURL: URL?
    @State private var isPrepared = false

    var body: some View {
        VStack(spacing: 16) {
            Text("Export your FocusFlow data as JSON.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Button("Prepare Export") {
                prepareExport()
            }
            .buttonStyle(.borderedProminent)

            if let exportURL {
                ShareLink(item: exportURL) {
                    Label("Share JSON", systemImage: "square.and.arrow.up")
                }
                .buttonStyle(.bordered)
            }

            if isPrepared && exportURL == nil {
                Text("Nothing to export yet.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .navigationTitle("Export")
    }

    private func prepareExport() {
        if let data = ExportService.buildExportPayload(context: modelContext) {
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("FocusFlow-export.json")
            try? data.write(to: url, options: [.atomic])
            exportURL = url
        } else {
            exportURL = nil
        }
        isPrepared = true
    }
}
