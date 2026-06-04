import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClassroomCardProps } from './classroom-card';

export const ClassroomRow = memo(function ClassroomRow({
  item: classroom,
  translations,
}: ClassroomCardProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{classroom.name}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {classroom.type === 'theory'
            ? translations['type.theory']
            : translations['type.lab']}
        </Badge>
      </TableCell>
      <TableCell>{classroom.capacity}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Editar">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Eliminar"
          >
            <Trash className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});
