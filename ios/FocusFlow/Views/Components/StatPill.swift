import SwiftUI

struct StatPill: View {
    let title: String
    let value: String
    let symbol: String
    let tint: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .foregroundStyle(tint)
                .frame(width: 28, height: 28)
                .background(tint.opacity(0.15))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.headline)
            }
            Spacer()
        }
        .padding(12)
        .background(Color.white.opacity(0.7))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
