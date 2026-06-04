import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SubjectGroupCardProps } from './subject-group-card';

export const SubjectGroupRow = memo(function SubjectGroupRow({ item: group, subjectMap, degreeMap, translations }: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  return (
    <TableRow>
      <TableCell className="font-medium">{group.name}</TableCell>
      <TableCell>{subject?.name ?? '-'}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {group.groupType ? translations[`typeOptions.${group.groupType}`] : translations['typeOptions.theory']}
        </Badge>
      </TableCell>
      <TableCell className="capitalize">{translations[`shiftOptions.${group.shift}`]}</TableCell>
      <TableCell>{group.numberOfStudents}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Editar">
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
            <Trash className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});
