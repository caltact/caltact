import { type NextApiRequest, type NextApiResponse } from 'next'
import contactManager from '../../database/ContactManager'
import userManager from '../../database/index'
import verifyUser from './utils/verifyUser'

// Handler function to handle when a user attempts to add a new contact
// Requires types/contact.ts
export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  // Olex's special authentication method
  if ((await verifyUser(req))) {
    console.log('Verified user')
  } else {
    res.status(401).json({ message: 'Invalid token' }); return
  }
  try {
    const u = await userManager.getUserByEmail(req.body.email)
    if (u === null) {
      // TODO: Fix status code
      res.status(400).json({ message: 'Errored out getting user by passed-in email' })
    } else {
      let contacts = await contactManager.getContacts(u.id)
      if (req.body.important === true) {
        contacts = contacts.filter((c: { important: boolean }) => c.important)
      }
      if (req.body.search) {
        contacts = contacts.filter(
          (c: { firstName: string, lastName: string }) => (c.firstName + ' ' + c.lastName).includes(req.body.search)
        )
      }
      res.status(200).json({ contacts })
    }
  } catch (error) {
    console.log(`Error in addContacts: ${error as string}`)
    res.status(400).json({
      message: 'Authentication failed',
      error: (error as any).message
    })
  }
}
