'use client';

import { useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import { z } from 'zod';
import { CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type ErrorSeverity = 'error' | 'warning';
type ErrorCategory =
  | 'structure'
  | 'parse'
  | 'validation'
  | 'reference'
  | 'duplicate'
  | 'business';

export interface CsvRowIssue {
  rowNumber?: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  column?: string;
  providedValue?: string;
  message: string;
}

interface GenericBulkUploaderProps<TData> {
  title: string;
  description?: string;
  schema: z.ZodType<TData, unknown>;
  expectedColumns: string[];
  rowTransformer: (row: Record<string, string>) => unknown;
  onAnalyze?: (
    validData: TData[]
  ) => Promise<{ finalValidData: TData[]; issues: CsvRowIssue[] }>;
  onUpload: (validData: TData[]) => Promise<void>;
  mode?: 'append' | 'overwrite';
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: TData[]
  ) => Promise<void>;
}

type Step = 'upload' | 'analyzing' | 'review' | 'uploading' | 'success';

export function GenericBulkUploader<TData>({
  title,
  description,
  expectedColumns,
  schema,
  rowTransformer,
  onAnalyze,
  onUpload,
  mode,
  onBeforeUpload,
}: GenericBulkUploaderProps<TData>) {
  const [step, setStep] = useState<Step>('upload');
  const [issues, setIssues] = useState<CsvRowIssue[]>([]);
  const [validData, setValidData] = useState<TData[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const t = useTranslations('Common.bulkUploader');

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStep('analyzing');
    setIssues([]);
    setValidData([]);
    setUploadError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const foundIssues: CsvRowIssue[] = [];
        const locallyValidData: TData[] = [];

        const headers = (results.meta.fields || []).filter(
          (col) => col.trim() !== ''
        );

        const missingColumns = expectedColumns.filter(
          (col) => !headers.includes(col)
        );
        if (missingColumns.length > 0) {
          foundIssues.push({
            category: 'structure',
            severity: 'error',
            message: t('structureMissing', {
              columns: missingColumns.join(', '),
            }),
          });
        }

        const extraColumns = headers.filter(
          (col) => !expectedColumns.includes(col)
        );
        if (extraColumns.length > 0) {
          foundIssues.push({
            category: 'structure',
            severity: 'error',
            message: t('structureExtra', { columns: extraColumns.join(', ') }),
          });
        }

        if (foundIssues.some((i) => i.category === 'structure')) {
          setIssues(foundIssues);
          setStep('review');
          return;
        }

        results.errors.forEach((err) => {
          foundIssues.push({
            rowNumber: err.row !== undefined ? err.row + 2 : undefined,
            category: 'parse',
            severity: 'error',
            message: err.message,
          });
        });

        results.data.forEach((row, index) => {
          try {
            const transformed = rowTransformer(row);
            const parsed = schema.safeParse(transformed);

            if (parsed.success) {
              locallyValidData.push(parsed.data);
            } else {
              parsed.error.issues.forEach((zodErr) => {
                const errorColumn = zodErr.path[0];
                const rawValue =
                  errorColumn && typeof errorColumn === 'string'
                    ? String(row[errorColumn] ?? 'N/A')
                    : 'N/A';

                foundIssues.push({
                  rowNumber: index + 2,
                  category: 'validation',
                  severity: 'error',
                  column: zodErr.path.join('.'),
                  providedValue: rawValue,
                  message: zodErr.message,
                });
              });
            }
          } catch {
            foundIssues.push({
              rowNumber: index + 2,
              category: 'structure',
              severity: 'error',
              message: t('transformError'),
            });
          }
        });

        let finalData = locallyValidData;
        if (onAnalyze && locallyValidData.length > 0) {
          try {
            const analysis = await onAnalyze(locallyValidData);
            finalData = analysis.finalValidData;
            foundIssues.push(...analysis.issues);
          } catch (error) {
            console.error('Error en el análisis:', error);
          }
        }

        setValidData(finalData);
        setIssues(foundIssues);
        setStep('review');
      },
    });
  };

  const handleConfirmUpload = async () => {
    setStep('uploading');
    setUploadError(null);
    try {
      if (onBeforeUpload) {
        await onBeforeUpload(mode, validData);
      }
      await onUpload(validData);
      setStep('success');
    } catch (err) {
      console.error('Upload error', err);
      setStep('review');
      setUploadError(t('saveError'));
    }
  };

  const reset = () => {
    setStep('upload');
    setIssues([]);
    setValidData([]);
    setUploadError(null);
  };

  if (step === 'success') {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
              {t('successTitle')}
            </h3>
            <p className="text-emerald-700 dark:text-emerald-300">
              {t('successDescription', { count: validData.length })}
            </p>
          </div>
          <Button onClick={reset} variant="outline" className="mt-4">
            {t('importAnother')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'review' || step === 'uploading') {
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const reviewCardClassName =
      'flex w-full max-w-full flex-col overflow-hidden';
    const tableShellClassName = 'overflow-hidden rounded-md border';
    const tableHeaderClassName =
      'sticky top-0 bg-gray-200/50 text-foreground backdrop-blur';
    const tableHeadClassName =
      'h-11 border-border/50 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground';
    const tableCellClassName =
      'border-border/50 px-4 py-3 text-sm text-foreground';
    const mutedCellClassName = 'font-mono text-xs text-muted-foreground';
    const rowClassName =
      'transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted';
    const reviewTableViewportClassName =
      'max-h-[min(70dvh,32rem)] w-full overflow-auto';

    return (
      <div className="w-full max-h-[calc(100dvh-2rem)] overflow-hidden">
        <Card className={reviewCardClassName}>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('reviewTitle')}</CardTitle>
                <CardDescription>{t('reviewDescription')}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  {validData.length} {t('ready')}
                </Badge>
                {errorCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 px-3 py-1 text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    {errorCount} {t('errors')}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    {warningCount} {t('warnings')}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              defaultValue={issues.length > 0 ? 'issues' : 'valid'}
              className="w-full"
            >
              <div className="pt-6">
                <TabsList>
                  <TabsTrigger
                    value="issues"
                    disabled={issues.length === 0}
                    className="data-[state=active]:bg-red-500/20 cursor-pointer"
                  >
                    {t('issuesTab')} ({issues.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="valid"
                    disabled={validData.length === 0}
                    className="data-[state=active]:bg-green-500/20 cursor-pointer"
                  >
                    {t('validTab')} ({validData.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="issues" className="mt-4 border-t">
                <div className={reviewTableViewportClassName}>
                  <div className={`${tableShellClassName} w-full`}>
                    <Table>
                      <TableHeader className={tableHeaderClassName}>
                        <TableRow className="border-zinc-200/70 dark:border-zinc-800/80">
                          <TableHead className={`${tableHeadClassName} w-16`}>
                            {t('row')}
                          </TableHead>
                          <TableHead className={`${tableHeadClassName} w-24`}>
                            {t('type')}
                          </TableHead>
                          <TableHead className={`${tableHeadClassName} w-32`}>
                            {t('column')}
                          </TableHead>
                          <TableHead className={`${tableHeadClassName} w-32`}>
                            {t('value')}
                          </TableHead>
                          <TableHead>{t('description')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issues.map((issue, idx) => (
                          <TableRow key={idx} className={rowClassName}>
                            <TableCell
                              className={
                                tableCellClassName + ' ' + mutedCellClassName
                              }
                            >
                              {issue.rowNumber ?? '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.severity === 'error'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="border-transparent bg-muted text-muted-foreground shadow-none dark:bg-muted dark:text-muted-foreground"
                              >
                                {issue.category}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={
                                tableCellClassName + ' ' + mutedCellClassName
                              }
                            >
                              {issue.column ?? '-'}
                            </TableCell>
                            <TableCell
                              className={`${tableCellClassName} ${mutedCellClassName} max-w-30 truncate`}
                              title={issue.providedValue}
                            >
                              {issue.providedValue ?? '-'}
                            </TableCell>
                            <TableCell
                              className={`${tableCellClassName} ${
                                issue.severity === 'error'
                                  ? 'text-red-600 dark:text-red-300'
                                  : 'text-amber-600 dark:text-amber-300'
                              }`}
                            >
                              {issue.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="valid" className="m-0 mt-4 border-t">
                <div className={reviewTableViewportClassName}>
                  {validData.length > 0 ? (
                    <div className={`${tableShellClassName} w-full`}>
                      <Table>
                        <TableHeader className={tableHeaderClassName}>
                          <TableRow className="border-zinc-200/70 dark:border-zinc-800/80">
                            <TableHead className={`${tableHeadClassName} w-24`}>
                              Estado
                            </TableHead>
                            {expectedColumns.map((col) => (
                              <TableHead
                                key={col}
                                className={`${tableHeadClassName} whitespace-nowrap`}
                              >
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validData.map((row, idx) => (
                            <TableRow key={idx} className={rowClassName}>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                                >
                                  Válido
                                </Badge>
                              </TableCell>

                              {expectedColumns.map((col) => {
                                const rawValue = (
                                  row as Record<string, unknown>
                                )[col];
                                let displayValue = '-';

                                if (Array.isArray(rawValue)) {
                                  displayValue = rawValue.join(', ');
                                } else if (typeof rawValue === 'boolean') {
                                  displayValue = rawValue ? 'true' : 'false';
                                } else if (
                                  rawValue !== undefined &&
                                  rawValue !== null
                                ) {
                                  displayValue = String(rawValue);
                                }

                                return (
                                  <TableCell
                                    key={col}
                                    className={`${tableCellClassName} max-w-50 truncate text-xs`}
                                    title={displayValue}
                                  >
                                    {displayValue}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center space-y-2 py-20 text-muted-foreground dark:text-muted-foreground">
                      <FileSpreadsheet className="h-10 w-10 text-emerald-500 opacity-50 dark:text-emerald-400" />
                      <p>{t('noValidRows')}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="space-y-3 border-t bg-muted/20 p-4">
            {uploadError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={reset}>
                {t('cancel')}
              </Button>
              <Button
                onClick={handleConfirmUpload}
                disabled={validData.length === 0 || step === 'uploading'}
                className="bg-brand-purple-bg text-brand-purple border border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover"
              >
                {step === 'uploading' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('importRecords', { count: validData.length })}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed bg-muted/20 transition-colors hover:bg-muted/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} <br />
          <span className="mt-2 block w-fit rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground dark:bg-muted dark:text-muted-foreground">
            Columnas: {expectedColumns.join(', ')}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".csv"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={handleFileUpload}
            disabled={step === 'analyzing'}
            className="cursor-pointer file:cursor-pointer max-w-sm"
          />
          {step === 'analyzing' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('analyzing')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
