import SwiftUI

struct EmptyStateView: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.title3)
                .fontWeight(.semibold)
            Text(message)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}
