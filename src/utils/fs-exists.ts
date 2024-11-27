import * as fs from 'fs/promises'


export async function fsExist(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath)
    return true
  } catch (err) {
    return false
  }
}
