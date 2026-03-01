import SwiftUI
import SwiftData

struct ExportView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var exportPayload: ExportPayload?
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

            if let exportPayload {
                ShareLink(item: exportPayload) {
                    Label("Share JSON", systemImage: "square.and.arrow.up")
                }
                .buttonStyle(.bordered)
            }

            if isPrepared && exportPayload == nil {
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
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            exportPayload = try? decoder.decode(ExportPayload.self, from: data)
        } else {
            exportPayload = nil
        }
        isPrepared = true
    }
}
