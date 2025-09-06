'use client';

import React from 'react';
import { Control, UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form';
import SortableLeadershipList from './SortableLeadershipList';

type Props<TForm extends FieldValues> = {
  control: Control<TForm>;
  register: UseFormRegister<TForm>;
  errors: FieldErrors<TForm>;
  // Path to the array field, typically "leadershipChoices"
  name: keyof TForm & string;
  teamOptions: string[];
  maxChoices?: number;
};

export default function LeadershipSection<TForm extends FieldValues>({
  control,
  register,
  errors,
  name,
  teamOptions,
  maxChoices = 3,
}: Props<TForm>) {
  // Data integrity note:
  // - This component intentionally does not cache or restore any previous snapshots of leadershipChoices.
  // - RHF is the single source of truth; unmounted fields are preserved (shouldUnregister=false by default).
  // - We do not repopulate leadershipChoices when the interest checkbox toggles back on, preventing resurrection of removed items.
  return (
    <SortableLeadershipList
      control={control}
      register={register}
      errors={errors}
      name={name}
      teamOptions={teamOptions}
      maxChoices={maxChoices}
    />
  );
}