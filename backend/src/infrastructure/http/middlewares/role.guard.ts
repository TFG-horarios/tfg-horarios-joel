import { Context, Next } from 'hono';
import { container, DI_TOKENS } from '../../di/container';
import { IOrganizationMemberRepository } from '../../../domain/repositories/organization-member.repository';
import { UserRole } from '../../../domain/entities/organization-member.entity';

export const roleGuard = (requiredRole: UserRole | UserRole[]) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    const orgId = c.req.param('orgId');

    if (!userId) {
      return c.json({ message: 'Unauthorized (no user ID)' }, 401);
    }

    if (!orgId) {
        return c.json({ message: 'Organization ID required for role check' }, 400);
    }

    const memberRepo = container.resolve<IOrganizationMemberRepository>(DI_TOKENS.OrganizationMemberRepository);
    const member = await memberRepo.findByUserInOrganization(userId, orgId);

    if (!member) {
      return c.json({ message: 'Forbidden (not a member of this organization)' }, 403);
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    const roleHierarchy: Record<UserRole, number> = {
        'admin': 3,
        'editor': 2,
        'viewer': 1
    };

    const userRoleValue = roleHierarchy[member.role];
    const isAuthorized = roles.some(r => userRoleValue >= roleHierarchy[r]);

    if (!isAuthorized) {
      return c.json({ message: 'Forbidden (insufficient permissions)' }, 403);
    }

    c.set('member', member);

    await next();
  };
};
