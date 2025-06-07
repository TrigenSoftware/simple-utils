import { PnpmWorkspacesProject } from '@simple-release/pnpm'

export const project = new PnpmWorkspacesProject({
  mode: 'independent'
})

export const releaser = {
  verbose: true
}

export const publish = {
  access: 'public'
}
