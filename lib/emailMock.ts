import { promises as fs } from 'fs'
import path from 'path'

type EmailPayload = {
  to: string
  subject: string
  text: string
}

const logPath = path.join(process.cwd(), 'data', 'email-log.json')

// Simple mock email sender: logs to console and appends to data/email-log.json.
export async function sendMockEmail(payload: EmailPayload): Promise<void> {
  const entry = { ...payload, sentAt: new Date().toISOString() }
  console.info('[mock-email]', entry)
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true })
    let existing: EmailPayload[] = []
    try {
      const raw = await fs.readFile(logPath, 'utf8')
      existing = raw.trim() ? (JSON.parse(raw) as EmailPayload[]) : []
    } catch {
      existing = []
    }
    await fs.writeFile(logPath, JSON.stringify([...existing, entry], null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to persist mock email log', err)
  }
}
