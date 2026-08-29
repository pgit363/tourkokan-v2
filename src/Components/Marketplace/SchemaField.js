/**
 * SchemaField — renders ONE attribute_schema field as the right control.
 *
 * The whole point of the server-driven form: the app never hardcodes fields;
 * it loops the category schema and drops the widget matching each `type`.
 * (see docs/app-api-integration.md §10)
 */
import React from 'react';
import {View, Text, TextInput, TouchableOpacity, Switch, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {C} from './theme';

const asArray = v => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);

const SchemaField = ({name, def = {}, value, onChange, error}) => {
  const {i18n} = useTranslation();
  const label =
    (i18n.language === 'mr' && def.mr_label) ||
    def.label ||
    name.replace(/_/g, ' ');
  const type = def.type;

  const Label = () => (
    <View style={s.labelRow}>
      <Text style={s.label}>
        {label} {def.required ? <Text style={s.req}>*</Text> : null}
      </Text>
      {(def.min != null || def.max != null) && (
        <Text style={s.hint}>
          {def.min != null ? def.min : ''}
          {def.min != null && def.max != null ? '–' : ''}
          {def.max != null ? def.max : ''}
        </Text>
      )}
    </View>
  );

  let control = null;

  if (type === 'bool') {
    return (
      <View style={[s.switchRow, error && s.errBorder]}>
        <Text style={s.switchLabel}>{label}</Text>
        <Switch
          value={!!value}
          onValueChange={onChange}
          trackColor={{true: C.oceanMid, false: '#D6D3D1'}}
          thumbColor="#fff"
        />
      </View>
    );
  }

  if (type === 'enum') {
    control = (
      <View style={s.seg}>
        {(def.options || []).map(opt => {
          const on = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[s.opt, on && s.optOn]}
              onPress={() => onChange(opt)}
              activeOpacity={0.8}>
              <Text style={[s.optTxt, on && s.optTxtOn]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  } else if (type === 'multi') {
    const sel = asArray(value);
    control = (
      <View style={s.seg}>
        {(def.options || []).map(opt => {
          const on = sel.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[s.opt, on && s.optOnForest]}
              onPress={() =>
                onChange(on ? sel.filter(x => x !== opt) : [...sel, opt])
              }
              activeOpacity={0.8}>
              <Text style={[s.optTxt, on && s.optTxtForest]}>
                {on ? '✓ ' : ''}
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  } else if (type === 'int' || type === 'decimal') {
    control = (
      <TextInput
        style={[s.input, error && s.errBorder]}
        value={value != null ? String(value) : ''}
        onChangeText={t =>
          onChange(type === 'int' ? t.replace(/[^0-9]/g, '') : t.replace(/[^0-9.]/g, ''))
        }
        keyboardType={type === 'int' ? 'number-pad' : 'decimal-pad'}
        placeholder={def.placeholder || ''}
        placeholderTextColor={C.textLight}
      />
    );
  } else if (type === 'text') {
    control = (
      <TextInput
        style={[s.input, s.textArea, error && s.errBorder]}
        value={value || ''}
        onChangeText={onChange}
        multiline
        placeholder={def.placeholder || ''}
        placeholderTextColor={C.textLight}
        maxLength={def.max}
      />
    );
  } else {
    // string / date / time — plain input with a format hint
    const ph =
      type === 'date' ? 'YYYY-MM-DD' : type === 'time' ? 'HH:MM' : def.placeholder || '';
    control = (
      <TextInput
        style={[s.input, error && s.errBorder]}
        value={value || ''}
        onChangeText={onChange}
        placeholder={ph}
        placeholderTextColor={C.textLight}
        maxLength={def.max}
      />
    );
  }

  return (
    <View style={s.field}>
      <Label />
      {control}
      {!!error && <Text style={s.errTxt}>{error}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  field: {marginBottom: 13},
  labelRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6},
  label: {fontSize: 11.5, fontWeight: '700', color: C.textMid},
  req: {color: '#B23A2E'},
  hint: {fontSize: 10, color: C.textLight, fontWeight: '600'},
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 11,
    fontSize: 13,
    color: C.textDark,
  },
  textArea: {height: 72, textAlignVertical: 'top', paddingTop: 11},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 13,
  },
  switchLabel: {fontSize: 12.5, fontWeight: '700', color: C.textDark},
  seg: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  opt: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#fff',
  },
  optOn: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.08)'},
  optOnForest: {borderColor: C.forestMid, backgroundColor: 'rgba(46,92,58,0.08)'},
  optTxt: {fontSize: 11.5, fontWeight: '700', color: C.textMid},
  optTxtOn: {color: C.oceanMid},
  optTxtForest: {color: C.forestMid},
  errBorder: {borderColor: '#B23A2E'},
  errTxt: {fontSize: 10.5, color: '#B23A2E', marginTop: 5},
});

export default SchemaField;
