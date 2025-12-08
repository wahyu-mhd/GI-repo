import { promises as fs } from 'fs'
import path from 'path'
import {
  Announcement,
  AnnouncementComment,
  mockAnnouncements,
  mockAnnouncementComments,
} from './mockData'

const announcementsPath = path.join(process.cwd(), 'data', 'announcements.json')
const commentsPath = path.join(process.cwd(), 'data', 'announcementComments.json')

// Volatile in-memory cache so the API still works if disk writes fail (e.g. read-only FS)
let volatileAnnouncements: Announcement[] = []
let volatileComments: AnnouncementComment[] = []

function mergeById<T extends { id: string }>(persisted: T[], volatile: T[]) {
  const map = new Map<string, T>()
  persisted.forEach(item => map.set(item.id, item))
  volatile.forEach(item => map.set(item.id, item))
  return Array.from(map.values())
}

async function ensureFile(filePath: string, seed: object[]): Promise<void> {
  try {
    await fs.access(filePath)
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(seed, null, 2), 'utf8')
  }
}

async function readJson<T>(filePath: string, seed: T[]): Promise<T[]> {
  try {
    await ensureFile(filePath, seed as object[])
    const raw = await fs.readFile(filePath, 'utf8')
    return raw.trim() ? (JSON.parse(raw) as T[]) : []
  } catch (error) {
    console.error(`readJson(${filePath}) failed, falling back to seed`, error)
    return [...seed]
  }
}

async function writeJson<T>(filePath: string, data: T[]): Promise<void> {
  await ensureFile(filePath, [])
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}

// ---------------------------------------------------
// Announcements
// ---------------------------------------------------

export async function readAnnouncements(): Promise<Announcement[]> {
  const persisted = await readJson<Announcement>(announcementsPath, mockAnnouncements)
  return mergeById(persisted, volatileAnnouncements)
}

export async function writeAnnouncements(announcements: Announcement[]): Promise<void> {
  await writeJson(announcementsPath, announcements)
  volatileAnnouncements = []
}

export async function addAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt'> & { createdAt?: string }
): Promise<Announcement> {
  const announcements = await readAnnouncements()
  const announcement: Announcement = {
    id: `announcement-${Date.now()}-${announcements.length}`,
    createdAt: data.createdAt ?? new Date().toISOString(),
    ...data,
  }
  try {
    await writeAnnouncements([...announcements, announcement])
  } catch (error) {
    console.error('addAnnouncement failed to write to disk, keeping in memory', error)
    volatileAnnouncements = mergeById(volatileAnnouncements, [announcement])
  }
  return announcement
}

export async function getAnnouncementsByCourseFile(courseId: string): Promise<Announcement[]> {
  const announcements = await readAnnouncements()
  return announcements
    .filter(a => a.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ---------------------------------------------------
// Comments
// ---------------------------------------------------

export async function readAnnouncementComments(): Promise<AnnouncementComment[]> {
  const persisted = await readJson<AnnouncementComment>(commentsPath, mockAnnouncementComments)
  return mergeById(persisted, volatileComments)
}

export async function writeAnnouncementComments(comments: AnnouncementComment[]): Promise<void> {
  await writeJson(commentsPath, comments)
  volatileComments = []
}

export async function addAnnouncementComment(
  data: Omit<AnnouncementComment, 'id' | 'createdAt'>
): Promise<AnnouncementComment> {
  const comments = await readAnnouncementComments()
  const comment: AnnouncementComment = {
    id: `announcement-comment-${Date.now()}-${comments.length}`,
    createdAt: new Date().toISOString(),
    ...data,
  }
  try {
    await writeAnnouncementComments([...comments, comment])
  } catch (error) {
    console.error('addAnnouncementComment failed to write to disk, keeping in memory', error)
    volatileComments = mergeById(volatileComments, [comment])
  }
  return comment
}

export async function getCommentsForAnnouncementFile(
  announcementId: string
): Promise<AnnouncementComment[]> {
  const comments = await readAnnouncementComments()
  return comments
    .filter(c => c.announcementId === announcementId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

export type AnnouncementThread = Announcement & { comments: AnnouncementComment[] }

export async function getAnnouncementThreadByCourse(
  courseId: string
): Promise<AnnouncementThread[]> {
  const [announcements, comments] = await Promise.all([
    readAnnouncements(),
    readAnnouncementComments(),
  ])

  return announcements
    .filter(a => a.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(announcement => ({
      ...announcement,
      comments: comments
        .filter(c => c.announcementId === announcement.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }))
}
