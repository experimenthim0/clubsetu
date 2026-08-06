# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install git for module downloads
RUN apk add --no-cache git

# Copy go module files first for layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /checkin-go \
    .

# Runtime stage — minimal scratch-like image
FROM alpine:3.20

# Add CA certificates for TLS and timezone data
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /checkin-go .

# Non-root user for security
RUN adduser -D -H checkin
USER checkin

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/checkin/health || exit 1

CMD ["./checkin-go"]
