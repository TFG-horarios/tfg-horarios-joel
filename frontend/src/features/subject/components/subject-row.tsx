import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SubjectCardProps } from './subject-card';

export const SubjectRow = memo(function SubjectRow({ item: subject, degreeMap, itineraryMap, translations }: SubjectCardProps) {
  const degreeName = degreeMap.get(subject.degreeId)?.name ?? translations.unassigned;
  const itineraryName = subject.itineraryId ? itineraryMap.get(subject.itineraryId)?.name : translations.common;

  return (
    <TableRow>
      <TableCell className="font-medium">{subject.name}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {subject.code}
        </Badge>
      </TableCell>
      <TableCell>{degreeName}</TableCell>
      <TableCell>{subject.courseYear}</TableCell>
      <TableCell>
        <Badge variant={subject.itineraryId ? 'secondary' : 'default'} className={subject.itineraryId ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}>
          {itineraryName}
        </Badge>
      </TableCell>
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
