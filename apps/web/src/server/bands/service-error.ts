export class BandServiceError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'BandServiceError'
    this.status = status
    this.details = details
  }
}
