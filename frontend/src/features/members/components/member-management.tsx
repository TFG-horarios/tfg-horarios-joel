'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MemberDTO } from '@tfg-horarios/shared';
import { AlertDialog } from '@/components/ui/alert-dialog';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { addMember, removeMember, updateMemberRole } from '../actions';

type MembersManagementProps = {
  organizationId: string;
  organizationName: string;
  currentUserId: string;
  canManage: boolean;
  members: MemberDTO[];
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
} | null;

const ROLE_BADGE_VARIANTS: Record<
  MemberDTO['role'],
  'default' | 'secondary' | 'outline'
> = {
  admin: 'default',
  editor: 'secondary',
  viewer: 'outline',
};

export function MembersManagement({
  organizationId,
  organizationName,
  currentUserId,
  canManage,
  members,
}: MembersManagementProps) {
  const router = useRouter();
  const addFormRef = useRef<HTMLFormElement | null>(null);
  const t = useTranslations('Organizations.membersManagement');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<MemberDTO | null>(null);
  const [newMemberRole, setNewMemberRole] =
    useState<MemberDTO['role']>('viewer');
  const [draftRoles, setDraftRoles] = useState<
    Record<string, MemberDTO['role']>
  >(() =>
    Object.fromEntries(members.map((member) => [member.id, member.role]))
  );

  useEffect(() => {
    setDraftRoles(
      Object.fromEntries(members.map((member) => [member.id, member.role]))
    );
  }, [members]);

  const sortedMembers = useMemo(() => {
    const roleOrder: Record<MemberDTO['role'], number> = {
      admin: 0,
      editor: 1,
      viewer: 2,
    };

    return [...members].sort((left, right) => {
      if (roleOrder[left.role] !== roleOrder[right.role]) {
        return roleOrder[left.role] - roleOrder[right.role];
      }

      const leftName = left.userName.toLowerCase();
      const rightName = right.userName.toLowerCase();

      if (leftName < rightName) {
        return -1;
      }

      if (leftName > rightName) {
        return 1;
      }

      return left.id.localeCompare(right.id);
    });
  }, [members]);

  const showMessage = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  const submitAddMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const role = newMemberRole;

    if (!email) {
      showMessage('error', t('message.invalidEmail'));
      return;
    }

    setPendingAction('add');
    void (async () => {
      try {
        await addMember(organizationId, { email, role });
        form.reset();
        setNewMemberRole('viewer');
        showMessage('success', t('message.added'));
        router.refresh();
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error ? error.message : t('message.addFailed')
        );
      } finally {
        setPendingAction(null);
      }
    })();
  };

  const submitRoleUpdate = (member: MemberDTO) => {
    const nextRole = draftRoles[member.id] ?? member.role;

    if (nextRole === member.role) {
      showMessage('success', t('message.roleUnchanged'));
      return;
    }

    setPendingAction(member.id);
    void (async () => {
      try {
        await updateMemberRole(organizationId, member.id, { role: nextRole });
        showMessage('success', t('message.roleUpdated'));
        router.refresh();
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error ? error.message : t('message.roleUpdateFailed')
        );
      } finally {
        setPendingAction(null);
      }
    })();
  };

  const confirmRemoval = () => {
    if (!memberToDelete) {
      return;
    }

    const member = memberToDelete;
    setMemberToDelete(null);
    setPendingAction(member.id);

    void (async () => {
      try {
        await removeMember(organizationId, member.id);
        showMessage('success', t('message.removed'));

        if (member.userId === currentUserId) {
          router.push('/organizations');
          router.refresh();
          return;
        }

        router.refresh();
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error ? error.message : t('message.removeFailed')
        );
      } finally {
        setPendingAction(null);
      }
    })();
  };

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card className="border-border bg-card shadow-card-light dark:shadow-none dark:border-border dark:bg-card">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="size-5 text-primary dark:text-primary" />
              {t('addTitle')}
            </CardTitle>
            <CardDescription>
              {t('addDescription', { organizationName })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              ref={addFormRef}
              onSubmit={submitAddMember}
              className="grid gap-4 md:grid-cols-[1.6fr_0.8fr_auto] md:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('roleLabel')}</Label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value) =>
                    setNewMemberRole(value as MemberDTO['role'])
                  }
                >
                  <SelectTrigger id="role" className="h-10 w-full">
                    <SelectValue placeholder={t('rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {t('roleOptions.admin')}
                    </SelectItem>
                    <SelectItem value="editor">
                      {t('roleOptions.editor')}
                    </SelectItem>
                    <SelectItem value="viewer">
                      {t('roleOptions.viewer')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={pendingAction === 'add'}
              >
                {pendingAction === 'add' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('adding')}
                  </>
                ) : (
                  t('addButton')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border bg-transparent p-6 dark:border-border">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-4" />
              {t('readOnlyTitle')}
            </CardTitle>
            <CardDescription>{t('readOnlyDescription')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {feedback ? (
        <div
          aria-live="polite"
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            feedback.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
              : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200'
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <Card className="border-border bg-card shadow-card-light dark:shadow-none dark:border-border dark:bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="size-5 text-primary dark:text-primary" />
            {t('tableTitle')}
          </CardTitle>
          <CardDescription>{t('tableDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('headers.name')}</TableHead>
                  <TableHead>{t('headers.email')}</TableHead>
                  <TableHead>{t('headers.role')}</TableHead>
                  <TableHead>{t('headers.updated')}</TableHead>
                  {canManage ? (
                    <TableHead className="text-right">
                      {t('headers.actions')}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((member) => {
                  const selectedRole = draftRoles[member.id] ?? member.role;
                  const hasPendingRow = pendingAction === member.id;
                  const isSelf = member.userId === currentUserId;
                  const canEditRow = canManage;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="whitespace-normal font-medium text-foreground dark:text-foreground">
                        {member.userName}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground dark:text-muted-foreground">
                            {t('self')}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground dark:text-muted-foreground">
                        {member.userEmail}
                      </TableCell>
                      <TableCell>
                        {canEditRow ? (
                          <div className="flex min-w-52 items-center gap-2">
                            <Select
                              value={selectedRole}
                              onValueChange={(value) =>
                                setDraftRoles((current) => ({
                                  ...current,
                                  [member.id]: value as MemberDTO['role'],
                                }))
                              }
                              disabled={hasPendingRow}
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  {t('roleOptions.admin')}
                                </SelectItem>
                                <SelectItem value="editor">
                                  {t('roleOptions.editor')}
                                </SelectItem>
                                <SelectItem value="viewer">
                                  {t('roleOptions.viewer')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge variant={ROLE_BADGE_VARIANTS[member.role]}>
                              {t(`roles.${member.role}`)}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant={ROLE_BADGE_VARIANTS[member.role]}>
                            {t(`roles.${member.role}`)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground dark:text-muted-foreground">
                        {new Intl.DateTimeFormat('es-ES', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(member.updatedAt))}
                      </TableCell>
                      {canEditRow ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => submitRoleUpdate(member)}
                              disabled={
                                hasPendingRow || selectedRole === member.role
                              }
                            >
                              {hasPendingRow ? (
                                <>
                                  <Loader2 className="size-4 animate-spin" />
                                  {t('saving')}
                                </>
                              ) : (
                                t('save')
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setMemberToDelete(member)}
                              disabled={hasPendingRow || isSelf}
                            >
                              <Trash2 className="size-4" />
                              {t('delete')}
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Card className="border-dashed border-zinc-300 bg-transparent p-6 dark:border-zinc-700">
              <CardHeader className="p-0">
                <CardDescription>{t('empty')}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={memberToDelete !== null}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDelete ? (
                <>
                  {t('deleteDescription', {
                    name: memberToDelete.userName,
                    organizationName,
                  })}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval} variant="destructive">
              {t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
