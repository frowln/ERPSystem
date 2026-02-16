#!/usr/bin/env python3
"""
Comprehensive Odoo Construction ERP Model Extractor.
Scans all construction_* modules and generates migration artifacts as JSON.
"""

import ast
import csv
import json
import os
import re
import glob
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ADDONS_DIR = "/Users/damirkasimov/Desktop/privod2/odoo/addons"
OUTPUT_DIR = "/Users/damirkasimov/Desktop/privod2/privod2_next/migration/artifacts"

# Odoo field types
ODOO_FIELD_TYPES = {
    'Char', 'Text', 'Html', 'Integer', 'Float', 'Boolean', 'Date', 'Datetime',
    'Binary', 'Selection', 'Many2one', 'One2many', 'Many2many', 'Reference',
    'Monetary', 'Image', 'Json', 'Properties', 'PropertiesDefinition',
}


def get_construction_modules():
    """Find all construction_* module directories."""
    modules = []
    for d in sorted(os.listdir(ADDONS_DIR)):
        if d.startswith('construction_') and os.path.isdir(os.path.join(ADDONS_DIR, d)):
            modules.append(d)
    return modules


def extract_string_value(node):
    """Extract string value from AST node."""
    if isinstance(node, ast.Constant):
        return node.value
    elif isinstance(node, ast.JoinedStr):
        return "<f-string>"
    elif isinstance(node, ast.Name):
        return f"<ref:{node.id}>"
    elif isinstance(node, ast.Attribute):
        return f"<attr>"
    elif isinstance(node, ast.Call):
        # Handle _('string') for translations
        if isinstance(node.func, ast.Name) and node.func.id == '_' and node.args:
            return extract_string_value(node.args[0])
        return "<computed>"
    elif isinstance(node, ast.BinOp):
        return "<computed>"
    elif isinstance(node, ast.List):
        items = []
        for elt in node.elts:
            if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
                key = extract_string_value(elt.elts[0])
                label = extract_string_value(elt.elts[1])
                items.append((key, label))
        return items
    return None


def parse_field_definition(node):
    """Parse a fields.FieldType(...) call and extract info."""
    field_info = {}

    # Get field type
    if isinstance(node.func, ast.Attribute):
        field_type = node.func.attr
        if field_type not in ODOO_FIELD_TYPES:
            return None
        field_info['type'] = field_type
    else:
        return None

    # Parse positional args
    if node.args:
        first_arg = extract_string_value(node.args[0])
        if isinstance(first_arg, str):
            field_info['string'] = first_arg
        # For relational fields, first arg is the comodel
        if field_type in ('Many2one', 'One2many', 'Many2many') and isinstance(first_arg, str) and '.' in str(first_arg):
            field_info['relation'] = first_arg

    # Parse keyword args
    for kw in node.keywords:
        if kw.arg == 'string':
            val = extract_string_value(kw.value)
            if val:
                field_info['string'] = val
        elif kw.arg == 'comodel_name':
            val = extract_string_value(kw.value)
            if val:
                field_info['relation'] = val
        elif kw.arg == 'inverse_name':
            val = extract_string_value(kw.value)
            if val:
                field_info['inverse_name'] = val
        elif kw.arg == 'required':
            if isinstance(kw.value, ast.Constant):
                field_info['required'] = bool(kw.value.value)
        elif kw.arg == 'readonly':
            if isinstance(kw.value, ast.Constant):
                field_info['readonly'] = bool(kw.value.value)
        elif kw.arg == 'default':
            val = extract_string_value(kw.value)
            if val is not None:
                field_info['default'] = str(val) if not isinstance(val, (bool, int, float)) else val
        elif kw.arg == 'selection':
            val = extract_string_value(kw.value)
            if isinstance(val, list):
                field_info['selection'] = val
        elif kw.arg == 'related':
            val = extract_string_value(kw.value)
            if val:
                field_info['related'] = val
        elif kw.arg == 'compute':
            val = extract_string_value(kw.value)
            if val:
                field_info['compute'] = val
        elif kw.arg == 'store':
            if isinstance(kw.value, ast.Constant):
                field_info['store'] = bool(kw.value.value)
        elif kw.arg == 'tracking':
            if isinstance(kw.value, ast.Constant):
                field_info['tracking'] = bool(kw.value.value)
        elif kw.arg == 'ondelete':
            val = extract_string_value(kw.value)
            if val:
                field_info['ondelete'] = val
        elif kw.arg == 'index':
            if isinstance(kw.value, ast.Constant):
                field_info['index'] = bool(kw.value.value)
        elif kw.arg == 'copy':
            if isinstance(kw.value, ast.Constant):
                field_info['copy'] = bool(kw.value.value)
        elif kw.arg == 'relation':
            val = extract_string_value(kw.value)
            if val:
                field_info['m2m_relation_table'] = val
        elif kw.arg == 'help':
            val = extract_string_value(kw.value)
            if val:
                field_info['help'] = val
        elif kw.arg == 'domain':
            field_info['has_domain'] = True
        elif kw.arg == 'groups':
            val = extract_string_value(kw.value)
            if val:
                field_info['groups'] = val

    # For relational fields, if comodel not found yet check first positional arg
    if field_type in ('Many2one', 'One2many', 'Many2many') and 'relation' not in field_info:
        if node.args:
            val = extract_string_value(node.args[0])
            if isinstance(val, str):
                field_info['relation'] = val

    return field_info


def parse_model_file(filepath, module_name):
    """Parse a Python model file and extract model definitions."""
    models = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
    except Exception as e:
        print(f"  Error reading {filepath}: {e}")
        return models

    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        print(f"  SyntaxError in {filepath}: {e}")
        return models

    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue

        model_info = {
            'module': module_name,
            'class_name': node.name,
            'name': None,
            'description': None,
            'fields': [],
            'inherits': [],
            'inherit': [],
            'rec_name': None,
            'order': None,
            'sql_constraints': [],
            'python_constraints': [],
            'methods': [],
            'file': os.path.relpath(filepath, ADDONS_DIR),
        }

        # Check base classes
        for base in node.bases:
            if isinstance(base, ast.Attribute):
                if hasattr(base, 'attr'):
                    model_info['inherits'].append(f"models.{base.attr}")
            elif isinstance(base, ast.Name):
                model_info['inherits'].append(base.id)

        # Parse class body
        for item in node.body:
            # _name, _inherit, _description, etc.
            if isinstance(item, ast.Assign):
                for target in item.targets:
                    if isinstance(target, ast.Name):
                        attr_name = target.id
                        if attr_name == '_name':
                            model_info['name'] = extract_string_value(item.value)
                        elif attr_name == '_description':
                            model_info['description'] = extract_string_value(item.value)
                        elif attr_name == '_inherit':
                            val = extract_string_value(item.value)
                            if isinstance(val, str):
                                model_info['inherit'] = [val]
                            elif isinstance(item.value, ast.List):
                                model_info['inherit'] = [
                                    extract_string_value(e)
                                    for e in item.value.elts
                                    if extract_string_value(e)
                                ]
                        elif attr_name == '_inherits':
                            if isinstance(item.value, ast.Dict):
                                for k in item.value.keys:
                                    val = extract_string_value(k)
                                    if val:
                                        model_info['inherit'].append(val)
                        elif attr_name == '_rec_name':
                            model_info['rec_name'] = extract_string_value(item.value)
                        elif attr_name == '_order':
                            model_info['order'] = extract_string_value(item.value)
                        elif attr_name == '_sql_constraints':
                            if isinstance(item.value, ast.List):
                                for elt in item.value.elts:
                                    if isinstance(elt, ast.Tuple) and len(elt.elts) >= 3:
                                        constraint = {
                                            'name': extract_string_value(elt.elts[0]),
                                            'definition': extract_string_value(elt.elts[1]),
                                            'message': extract_string_value(elt.elts[2]),
                                        }
                                        model_info['sql_constraints'].append(constraint)
                        # Field definitions: field_name = fields.Type(...)
                        elif isinstance(item.value, ast.Call):
                            field_info = parse_field_definition(item.value)
                            if field_info:
                                field_info['name'] = attr_name
                                model_info['fields'].append(field_info)

            # Methods
            elif isinstance(item, ast.FunctionDef) or isinstance(item, ast.AsyncFunctionDef):
                method_info = {'name': item.name}
                # Check for decorators
                decorators = []
                for dec in item.decorator_list:
                    if isinstance(dec, ast.Attribute):
                        decorators.append(f"api.{dec.attr}" if hasattr(dec, 'attr') else str(dec.attr))
                    elif isinstance(dec, ast.Name):
                        decorators.append(dec.id)
                    elif isinstance(dec, ast.Call):
                        if isinstance(dec.func, ast.Attribute):
                            decorators.append(f"api.{dec.func.attr}")
                        elif isinstance(dec.func, ast.Name):
                            decorators.append(dec.func.id)
                if decorators:
                    method_info['decorators'] = decorators

                # Check for @api.constrains
                for dec in item.decorator_list:
                    if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                        if dec.func.attr == 'constrains':
                            constraint_fields = [extract_string_value(a) for a in dec.args]
                            model_info['python_constraints'].append({
                                'method': item.name,
                                'fields': constraint_fields,
                            })

                model_info['methods'].append(method_info)

        # If no _name but has _inherit, it's extending existing model
        if not model_info['name'] and model_info['inherit']:
            model_info['name'] = model_info['inherit'][0]
            model_info['is_extension'] = True

        if model_info['name']:
            models.append(model_info)

    return models


def parse_security_csv(filepath, module_name):
    """Parse ir.model.access.csv file."""
    rules = []
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rule = {
                    'module': module_name,
                    'id': row.get('id', ''),
                    'name': row.get('name', ''),
                    'model_id': row.get('model_id:id', row.get('model_id/id', '')),
                    'group_id': row.get('group_id:id', row.get('group_id/id', '')),
                    'perm_read': row.get('perm_read', '0') == '1',
                    'perm_write': row.get('perm_write', '0') == '1',
                    'perm_create': row.get('perm_create', '0') == '1',
                    'perm_unlink': row.get('perm_unlink', '0') == '1',
                    'file': os.path.relpath(filepath, ADDONS_DIR),
                }
                rules.append(rule)
    except Exception as e:
        print(f"  Error parsing CSV {filepath}: {e}")
    return rules


def parse_security_xml(filepath, module_name):
    """Parse security XML files for record rules and groups."""
    record_rules = []
    groups = []

    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except Exception as e:
        print(f"  Error parsing XML {filepath}: {e}")
        return record_rules, groups

    for record in root.iter('record'):
        model = record.get('model', '')
        rec_id = record.get('id', '')

        if model == 'ir.rule':
            rule = {
                'module': module_name,
                'id': rec_id,
                'name': '',
                'model_id': '',
                'domain_force': '',
                'groups': [],
                'global': False,
                'file': os.path.relpath(filepath, ADDONS_DIR),
            }
            for field in record.findall('field'):
                fname = field.get('name', '')
                if fname == 'name':
                    rule['name'] = field.text or ''
                elif fname == 'model_id':
                    rule['model_id'] = field.get('ref', field.text or '')
                elif fname == 'domain_force':
                    rule['domain_force'] = field.text or ''
                elif fname == 'groups':
                    groups_str = field.get('eval', '')
                    if groups_str:
                        rule['groups_eval'] = groups_str
                    # Also check for ref
                    refs = []
                    for sub in field:
                        if sub.tag == 'group' or sub.get('ref'):
                            refs.append(sub.get('ref', ''))
                    if refs:
                        rule['groups'] = refs
                elif fname == 'global':
                    val = field.get('eval', field.text or '')
                    rule['global'] = val.strip().lower() in ('true', '1')
                elif fname == 'perm_read':
                    rule['perm_read'] = field.get('eval', field.text or '') not in ('False', '0', 'false')
                elif fname == 'perm_write':
                    rule['perm_write'] = field.get('eval', field.text or '') not in ('False', '0', 'false')
                elif fname == 'perm_create':
                    rule['perm_create'] = field.get('eval', field.text or '') not in ('False', '0', 'false')
                elif fname == 'perm_unlink':
                    rule['perm_unlink'] = field.get('eval', field.text or '') not in ('False', '0', 'false')
            record_rules.append(rule)

        elif model == 'res.groups':
            group = {
                'module': module_name,
                'id': rec_id,
                'name': '',
                'category_id': '',
                'implied_ids': [],
                'file': os.path.relpath(filepath, ADDONS_DIR),
            }
            for field in record.findall('field'):
                fname = field.get('name', '')
                if fname == 'name':
                    group['name'] = field.text or ''
                elif fname == 'category_id':
                    group['category_id'] = field.get('ref', field.text or '')
                elif fname == 'implied_ids':
                    eval_str = field.get('eval', '')
                    if eval_str:
                        group['implied_ids_eval'] = eval_str
            groups.append(group)

    # Also check for category records
    for record in root.iter('record'):
        if record.get('model') == 'ir.module.category':
            cat = {
                'module': module_name,
                'id': record.get('id', ''),
                'type': 'category',
                'name': '',
            }
            for field in record.findall('field'):
                if field.get('name') == 'name':
                    cat['name'] = field.text or ''
            groups.append(cat)

    return record_rules, groups


def parse_views_xml(filepath, module_name):
    """Parse view XML files for view definitions and menu items."""
    views = []
    menus = []

    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except Exception as e:
        print(f"  Error parsing XML {filepath}: {e}")
        return views, menus

    # Parse records that define views
    for record in root.iter('record'):
        model = record.get('model', '')
        if model == 'ir.ui.view':
            view = {
                'module': module_name,
                'id': record.get('id', ''),
                'name': '',
                'model': '',
                'type': '',
                'priority': 16,
                'inherit_id': '',
                'key_fields': [],
                'file': os.path.relpath(filepath, ADDONS_DIR),
            }
            for field in record.findall('field'):
                fname = field.get('name', '')
                if fname == 'name':
                    view['name'] = field.text or ''
                elif fname == 'model':
                    view['model'] = field.text or ''
                elif fname == 'type':
                    view['type'] = field.text or ''
                elif fname == 'priority':
                    try:
                        view['priority'] = int(field.text or '16')
                    except (ValueError, TypeError):
                        pass
                elif fname == 'inherit_id':
                    view['inherit_id'] = field.get('ref', field.text or '')
                elif fname == 'arch':
                    arch_type = field.get('type', '')
                    # Try to determine view type from arch content
                    arch_text = ET.tostring(field, encoding='unicode') if field is not None else ''
                    if '<tree' in arch_text or '<list' in arch_text:
                        if not view['type']:
                            view['type'] = 'tree'
                    elif '<form' in arch_text:
                        if not view['type']:
                            view['type'] = 'form'
                    elif '<kanban' in arch_text:
                        if not view['type']:
                            view['type'] = 'kanban'
                    elif '<search' in arch_text:
                        if not view['type']:
                            view['type'] = 'search'
                    elif '<pivot' in arch_text:
                        if not view['type']:
                            view['type'] = 'pivot'
                    elif '<graph' in arch_text:
                        if not view['type']:
                            view['type'] = 'graph'
                    elif '<calendar' in arch_text:
                        if not view['type']:
                            view['type'] = 'calendar'
                    elif '<gantt' in arch_text:
                        if not view['type']:
                            view['type'] = 'gantt'
                    elif '<activity' in arch_text:
                        if not view['type']:
                            view['type'] = 'activity'
                    elif '<map' in arch_text:
                        if not view['type']:
                            view['type'] = 'map'

                    # Extract key fields shown in view
                    field_names = re.findall(r'name=["\']([a-z_]+)["\']', arch_text)
                    # Limit to unique fields
                    seen = set()
                    for fn in field_names:
                        if fn not in seen and fn not in ('arch', 'type', 'model', 'name', 'inherit_id', 'priority'):
                            seen.add(fn)
                            view['key_fields'].append(fn)

            if view['model'] or view['inherit_id']:
                views.append(view)

    # Parse menuitem elements
    for menuitem in root.iter('menuitem'):
        menu = {
            'module': module_name,
            'id': menuitem.get('id', ''),
            'name': menuitem.get('name', ''),
            'parent': menuitem.get('parent', ''),
            'action': menuitem.get('action', ''),
            'sequence': menuitem.get('sequence', ''),
            'groups': menuitem.get('groups', ''),
            'web_icon': menuitem.get('web_icon', ''),
            'file': os.path.relpath(filepath, ADDONS_DIR),
        }
        menus.append(menu)

    # Parse act_window records
    for record in root.iter('record'):
        if record.get('model') == 'ir.actions.act_window':
            # Just note these exist, they complement menus
            pass

    return views, menus


def parse_report_xml(filepath, module_name):
    """Parse report XML files for QWeb reports."""
    reports = []
    templates = []

    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except Exception as e:
        print(f"  Error parsing XML {filepath}: {e}")
        return reports, templates

    # Report records
    for record in root.iter('record'):
        model = record.get('model', '')
        if model == 'ir.actions.report':
            report = {
                'module': module_name,
                'id': record.get('id', ''),
                'name': '',
                'model': '',
                'report_name': '',
                'report_type': 'qweb-pdf',
                'file': os.path.relpath(filepath, ADDONS_DIR),
            }
            for field in record.findall('field'):
                fname = field.get('name', '')
                if fname == 'name':
                    report['name'] = field.text or ''
                elif fname == 'model':
                    report['model'] = field.text or ''
                elif fname == 'report_name':
                    report['report_name'] = field.text or ''
                elif fname == 'report_type':
                    report['report_type'] = field.text or ''
            reports.append(report)
        elif model == 'mail.template':
            template = {
                'module': module_name,
                'id': record.get('id', ''),
                'name': '',
                'model_id': '',
                'subject': '',
                'file': os.path.relpath(filepath, ADDONS_DIR),
            }
            for field in record.findall('field'):
                fname = field.get('name', '')
                if fname == 'name':
                    template['name'] = field.text or ''
                elif fname == 'model_id':
                    template['model_id'] = field.get('ref', field.text or '')
                elif fname == 'subject':
                    template['subject'] = field.text or ''
            templates.append(template)

    # Also check for <report> shortcut elements
    for rep_el in root.iter('report'):
        report = {
            'module': module_name,
            'id': rep_el.get('id', ''),
            'name': rep_el.get('name', rep_el.get('string', '')),
            'model': rep_el.get('model', ''),
            'report_name': rep_el.get('report_name', rep_el.get('file', '')),
            'report_type': rep_el.get('report_type', 'qweb-pdf'),
            'file': os.path.relpath(filepath, ADDONS_DIR),
        }
        reports.append(report)

    # QWeb templates
    for template in root.iter('template'):
        tmpl = {
            'module': module_name,
            'id': template.get('id', ''),
            'inherit_id': template.get('inherit_id', ''),
            'type': 'qweb_template',
            'file': os.path.relpath(filepath, ADDONS_DIR),
        }
        templates.append(tmpl)

    return reports, templates


def extract_workflows(all_models):
    """Extract workflow/state machine info from models that have state/status fields."""
    workflows = []

    for model in all_models:
        state_fields = []
        for field in model.get('fields', []):
            if field['name'] in ('state', 'status', 'stage') and field.get('type') == 'Selection':
                state_fields.append(field)

        if not state_fields:
            continue

        for state_field in state_fields:
            workflow = {
                'module': model['module'],
                'model': model['name'],
                'field': state_field['name'],
                'states': [],
                'transitions': [],
                'default': state_field.get('default'),
                'file': model.get('file', ''),
            }

            # Extract states from selection
            selection = state_field.get('selection', [])
            if isinstance(selection, list):
                for item in selection:
                    if isinstance(item, tuple) and len(item) == 2:
                        workflow['states'].append({
                            'value': item[0],
                            'label': item[1],
                        })

            # Extract transitions from methods
            for method in model.get('methods', []):
                method_name = method['name']
                # Common state transition method patterns
                if method_name.startswith('action_') or method_name.startswith('button_'):
                    # Try to infer from/to states from method name
                    transition = {
                        'method': method_name,
                        'type': 'button',
                    }
                    # Try to match common patterns
                    for state_item in workflow['states']:
                        sval = state_item['value']
                        if sval in method_name:
                            transition['to_state'] = sval
                    workflow['transitions'].append(transition)

            workflows.append(workflow)

    return workflows


def extract_integrations(modules):
    """Scan for external integrations across all modules."""
    integrations = []

    # Known integration patterns
    integration_patterns = {
        '1c': {'name': '1C Enterprise', 'type': 'ERP Integration'},
        'bank_api': {'name': 'Bank API', 'type': 'Financial Integration'},
        'sberbank': {'name': 'Sberbank', 'type': 'Bank Integration'},
        'alfa': {'name': 'Alfa-Bank', 'type': 'Bank Integration'},
        'tinkoff': {'name': 'Tinkoff', 'type': 'Bank Integration'},
        'vtb': {'name': 'VTB', 'type': 'Bank Integration'},
        'tochka': {'name': 'Tochka Bank', 'type': 'Bank Integration'},
        'openai': {'name': 'OpenAI', 'type': 'AI Integration'},
        'sbis': {'name': 'SBIS (EDO)', 'type': 'EDO Integration'},
        'edo': {'name': 'EDO', 'type': 'Electronic Document Exchange'},
        'synology': {'name': 'Synology NAS', 'type': 'Storage Integration'},
        'webdav': {'name': 'WebDAV', 'type': 'Storage Integration'},
        'nanocad': {'name': 'NanoCAD', 'type': 'CAD Integration'},
        'renga': {'name': 'Renga', 'type': 'BIM Integration'},
        'oidc': {'name': 'OpenID Connect', 'type': 'Auth Integration'},
        'crm': {'name': 'CRM', 'type': 'CRM Integration'},
        'fleet': {'name': 'Fleet Management', 'type': 'Fleet Integration'},
        'ifc': {'name': 'IFC (BIM)', 'type': 'BIM Format'},
        'gis': {'name': 'GIS', 'type': 'Geospatial Integration'},
        'iot': {'name': 'IoT', 'type': 'IoT Integration'},
        'pwa': {'name': 'PWA', 'type': 'Mobile/Web'},
        'ocr': {'name': 'OCR', 'type': 'Document Recognition'},
        'acquiring': {'name': 'Acquiring/Payment', 'type': 'Payment Integration'},
    }

    found_integrations = {}

    for module in modules:
        module_dir = os.path.join(ADDONS_DIR, module)

        # Check module name for integration hints
        for pattern, info in integration_patterns.items():
            if pattern in module.lower():
                key = info['name']
                if key not in found_integrations:
                    found_integrations[key] = {
                        'name': info['name'],
                        'type': info['type'],
                        'modules': [],
                        'files': [],
                        'endpoints': [],
                        'api_methods': [],
                    }
                found_integrations[key]['modules'].append(module)

        # Scan Python files for API calls, URLs, external service references
        for root_dir, dirs, files in os.walk(module_dir):
            dirs[:] = [d for d in dirs if d != '__pycache__']
            for fname in files:
                if not fname.endswith('.py'):
                    continue
                fpath = os.path.join(root_dir, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        content = f.read()
                except:
                    continue

                # Check for HTTP requests
                if 'requests.get' in content or 'requests.post' in content or 'requests.put' in content:
                    # Find URLs
                    urls = re.findall(r'https?://[^\s\'"]+', content)
                    for url in urls:
                        for pattern, info in integration_patterns.items():
                            if pattern in url.lower() or pattern in fname.lower():
                                key = info['name']
                                if key not in found_integrations:
                                    found_integrations[key] = {
                                        'name': info['name'],
                                        'type': info['type'],
                                        'modules': [],
                                        'files': [],
                                        'endpoints': [],
                                        'api_methods': [],
                                    }
                                rel_path = os.path.relpath(fpath, ADDONS_DIR)
                                if rel_path not in found_integrations[key]['files']:
                                    found_integrations[key]['files'].append(rel_path)
                                if url not in found_integrations[key]['endpoints']:
                                    found_integrations[key]['endpoints'].append(url[:200])

                # Check for specific API patterns
                for pattern, info in integration_patterns.items():
                    if pattern in fname.lower() or pattern in content.lower()[:5000]:
                        key = info['name']
                        if key not in found_integrations:
                            found_integrations[key] = {
                                'name': info['name'],
                                'type': info['type'],
                                'modules': [],
                                'files': [],
                                'endpoints': [],
                                'api_methods': [],
                            }
                        rel_path = os.path.relpath(fpath, ADDONS_DIR)
                        if rel_path not in found_integrations[key]['files']:
                            found_integrations[key]['files'].append(rel_path)
                        if module not in found_integrations[key]['modules']:
                            found_integrations[key]['modules'].append(module)

    return list(found_integrations.values())


def build_capability_map(modules, all_models):
    """Build a high-level capability map grouping modules by business domain."""
    domain_map = {
        'Project Management': {
            'description': 'Core project management, planning, scheduling',
            'keywords': ['base', 'project', 'planning', 'gantt', 'calendar', 'monthly_schedule'],
            'modules': [],
        },
        'Financial Management': {
            'description': 'Budgeting, cost control, banking, payments, accounting',
            'keywords': ['finance', 'estimate', 'russian_accounting', 'ens'],
            'modules': [],
        },
        'Contract Management': {
            'description': 'Contract lifecycle, supplements, claims, SLA',
            'keywords': ['contract'],
            'modules': [],
        },
        'Document Management': {
            'description': 'Documents, drawings, annotations, electronic signatures, EDO',
            'keywords': ['document', 'drawing', 'edo', 'edi', 'russian_document'],
            'modules': [],
        },
        'Human Resources': {
            'description': 'HR management, crew management, timesheets',
            'keywords': ['hr', 'crew_time', 'timesheet'],
            'modules': [],
        },
        'Supply Chain & Procurement': {
            'description': 'Procurement, stock, materials, logistics, reservation',
            'keywords': ['procurement', 'stock', 'material', 'logistics', 'reservation', 'purchase', 'specification'],
            'modules': [],
        },
        'Safety & Compliance': {
            'description': 'Safety management, certificates, tolerances, regulatory',
            'keywords': ['safety', 'certificate', 'tolerance', 'regulatory', 'legal'],
            'modules': [],
        },
        'Quality & Inspections': {
            'description': 'Quality control, punch lists, submittals, PTO',
            'keywords': ['punch_list', 'submittal', 'pto', 'audit', 'daily_log'],
            'modules': [],
        },
        'BIM & Design': {
            'description': 'BIM, 3D modeling, design management, IFC',
            'keywords': ['bim', 'design', 'photo_progress'],
            'modules': [],
        },
        'Analytics & Reporting': {
            'description': 'Dashboards, KPIs, analytics, reports, BI',
            'keywords': ['analytics', 'kpi', 'report', 'lrv', 'journals'],
            'modules': [],
        },
        'Integration & API': {
            'description': 'External integrations, APIs, webhooks',
            'keywords': ['1c_integration', 'api', 'integration', 'crm_integration', 'fleet_integration',
                         'maintenance_integration', 'stock_integration', 'purchase_integration',
                         'timesheet_integration', 'calendar_integration'],
            'modules': [],
        },
        'AI & ML': {
            'description': 'AI assistants, OCR, machine learning, computer vision',
            'keywords': ['ai', 'ocr'],
            'modules': [],
        },
        'Security & Auth': {
            'description': 'Authentication, authorization, RBAC, MFA, security',
            'keywords': ['security', 'rbac', 'mfa', 'auth_oidc', 'kep'],
            'modules': [],
        },
        'Infrastructure': {
            'description': 'Caching, monitoring, DevOps, search, mobile, PWA',
            'keywords': ['cache', 'monitoring', 'devops', 'search', 'mobile', 'pwa', 'ops', 'support'],
            'modules': [],
        },
        'UI & UX': {
            'description': 'Theme, UI improvements, discuss',
            'keywords': ['theme', 'ui_improvement', 'discuss', 'website'],
            'modules': [],
        },
        'Field Operations': {
            'description': 'Dispatch, IoT, fleet, contractor portal',
            'keywords': ['dispatch', 'iot', 'contractor_portal'],
            'modules': [],
        },
        'Demo & Seed Data': {
            'description': 'Demo data, seed scripts',
            'keywords': ['demo'],
            'modules': [],
        },
    }

    assigned = set()

    for module in modules:
        module_short = module.replace('construction_', '')
        best_match = None
        best_score = 0

        for domain, info in domain_map.items():
            for keyword in info['keywords']:
                if keyword == module_short or module_short.startswith(keyword) or keyword in module_short:
                    score = len(keyword)
                    if score > best_score:
                        best_score = score
                        best_match = domain

        if best_match:
            domain_map[best_match]['modules'].append(module)
            assigned.add(module)
        else:
            # Put unassigned in most relevant or 'Other'
            if 'Other' not in domain_map:
                domain_map['Other'] = {
                    'description': 'Other modules',
                    'keywords': [],
                    'modules': [],
                }
            domain_map['Other']['modules'].append(module)

    # Build final capability map
    capabilities = []
    for domain, info in domain_map.items():
        if info['modules']:
            # Count models per domain
            model_count = sum(
                1 for m in all_models
                if m['module'] in info['modules'] and not m.get('is_extension')
            )
            capabilities.append({
                'domain': domain,
                'description': info['description'],
                'modules': info['modules'],
                'module_count': len(info['modules']),
                'model_count': model_count,
            })

    return capabilities


def main():
    print("=" * 80)
    print("Construction ERP Migration Artifact Extractor")
    print("=" * 80)

    modules = get_construction_modules()
    print(f"\nFound {len(modules)} construction_* modules")

    # ======================================================================
    # 1. MODELS
    # ======================================================================
    print("\n--- Extracting Models ---")
    all_models = []

    for module in modules:
        models_dir = os.path.join(ADDONS_DIR, module, 'models')
        if not os.path.isdir(models_dir):
            # Some modules might have models in other locations
            continue

        for fname in sorted(os.listdir(models_dir)):
            if fname.endswith('.py') and fname != '__init__.py':
                fpath = os.path.join(models_dir, fname)
                models = parse_model_file(fpath, module)
                all_models.extend(models)

    # Also check wizards directory
    for module in modules:
        wizards_dir = os.path.join(ADDONS_DIR, module, 'wizards')
        if not os.path.isdir(wizards_dir):
            continue
        for fname in sorted(os.listdir(wizards_dir)):
            if fname.endswith('.py') and fname != '__init__.py':
                fpath = os.path.join(wizards_dir, fname)
                models = parse_model_file(fpath, module)
                for m in models:
                    m['is_wizard'] = True
                all_models.extend(models)

    # Also check services directory for TransientModels
    for module in modules:
        services_dir = os.path.join(ADDONS_DIR, module, 'services')
        if not os.path.isdir(services_dir):
            continue
        for fname in sorted(os.listdir(services_dir)):
            if fname.endswith('.py') and fname != '__init__.py':
                fpath = os.path.join(services_dir, fname)
                models = parse_model_file(fpath, module)
                for m in models:
                    m['is_service'] = True
                all_models.extend(models)

    print(f"  Extracted {len(all_models)} model/class definitions")

    # Clean up for JSON output
    models_output = []
    for m in all_models:
        out = {
            'module': m['module'],
            'name': m['name'],
            'class_name': m.get('class_name'),
            'description': m.get('description'),
            'fields': [],
            'inherits': m.get('inherits', []),
            'inherit': m.get('inherit', []),
            'rec_name': m.get('rec_name'),
            'order': m.get('order'),
            'sql_constraints': m.get('sql_constraints', []),
            'python_constraints': m.get('python_constraints', []),
            'methods': [md['name'] for md in m.get('methods', [])],
            'file': m.get('file'),
        }
        if m.get('is_extension'):
            out['is_extension'] = True
        if m.get('is_wizard'):
            out['is_wizard'] = True
        if m.get('is_service'):
            out['is_service'] = True

        for f in m.get('fields', []):
            field_out = {
                'name': f['name'],
                'type': f['type'],
                'required': f.get('required', False),
                'relation': f.get('relation'),
                'string': f.get('string'),
            }
            if f.get('selection'):
                field_out['selection'] = [
                    {'value': s[0], 'label': s[1]} if isinstance(s, tuple) else s
                    for s in f['selection']
                ]
            if f.get('compute'):
                field_out['compute'] = f['compute']
            if f.get('related'):
                field_out['related'] = f['related']
            if f.get('store') is not None:
                field_out['store'] = f['store']
            if f.get('readonly'):
                field_out['readonly'] = True
            if f.get('tracking'):
                field_out['tracking'] = True
            if f.get('inverse_name'):
                field_out['inverse_name'] = f['inverse_name']
            if f.get('ondelete'):
                field_out['ondelete'] = f['ondelete']
            if f.get('index'):
                field_out['index'] = True
            if f.get('default') is not None:
                field_out['default'] = f['default']
            if f.get('groups'):
                field_out['groups'] = f['groups']
            if f.get('help'):
                field_out['help'] = f['help']
            out['fields'].append(field_out)

        models_output.append(out)

    with open(os.path.join(OUTPUT_DIR, 'models.json'), 'w', encoding='utf-8') as f:
        json.dump({'models': models_output, 'total_count': len(models_output), 'module_count': len(modules)}, f, indent=2, ensure_ascii=False)
    print(f"  Written models.json ({len(models_output)} models)")

    # ======================================================================
    # 2. ACL (Security)
    # ======================================================================
    print("\n--- Extracting Security Rules ---")
    all_acl = []
    all_record_rules = []
    all_groups = []

    for module in modules:
        security_dir = os.path.join(ADDONS_DIR, module, 'security')
        if not os.path.isdir(security_dir):
            continue

        for fname in sorted(os.listdir(security_dir)):
            fpath = os.path.join(security_dir, fname)
            if fname.endswith('.csv'):
                rules = parse_security_csv(fpath, module)
                all_acl.extend(rules)
            elif fname.endswith('.xml'):
                record_rules, groups = parse_security_xml(fpath, module)
                all_record_rules.extend(record_rules)
                all_groups.extend(groups)

    acl_output = {
        'access_rules': all_acl,
        'record_rules': all_record_rules,
        'groups': all_groups,
        'total_access_rules': len(all_acl),
        'total_record_rules': len(all_record_rules),
        'total_groups': len(all_groups),
    }

    with open(os.path.join(OUTPUT_DIR, 'acl.json'), 'w', encoding='utf-8') as f:
        json.dump(acl_output, f, indent=2, ensure_ascii=False)
    print(f"  Written acl.json ({len(all_acl)} access rules, {len(all_record_rules)} record rules, {len(all_groups)} groups)")

    # ======================================================================
    # 3. WORKFLOWS
    # ======================================================================
    print("\n--- Extracting Workflows ---")

    # For workflows, we need to go deeper - read the actual Python files to find state transitions
    workflows = extract_workflows(all_models)

    # Also do a deeper scan for transition methods
    for wf in workflows:
        module_dir = os.path.join(ADDONS_DIR, wf['module'])
        model_file = os.path.join(ADDONS_DIR, wf.get('file', ''))
        if os.path.exists(model_file):
            try:
                with open(model_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Find self.write({'state': 'xxx'}) or self.state = 'xxx' patterns
                state_writes = re.findall(
                    r"(?:self\.write\s*\(\s*\{[^}]*?['\"]" + re.escape(wf['field']) + r"['\"]:\s*['\"](\w+)['\"]",
                    content
                )
                state_assigns = re.findall(
                    r"self\." + re.escape(wf['field']) + r"\s*=\s*['\"](\w+)['\"]",
                    content
                )

                all_target_states = set(state_writes + state_assigns)

                # Map transitions to their methods more accurately
                for t in wf['transitions']:
                    method_name = t['method']
                    # Find the method in the source
                    method_match = re.search(
                        r"def\s+" + re.escape(method_name) + r"\s*\(.*?\).*?(?=\n    def |\nclass |\Z)",
                        content, re.DOTALL
                    )
                    if method_match:
                        method_body = method_match.group()
                        # Find state transitions in this method
                        writes_in_method = re.findall(
                            r"['\"]" + re.escape(wf['field']) + r"['\"]:\s*['\"](\w+)['\"]",
                            method_body
                        )
                        assigns_in_method = re.findall(
                            r"self\." + re.escape(wf['field']) + r"\s*=\s*['\"](\w+)['\"]",
                            method_body
                        )
                        targets = writes_in_method + assigns_in_method
                        if targets:
                            t['to_state'] = targets[0]  # Take the first/primary state transition
            except:
                pass

    with open(os.path.join(OUTPUT_DIR, 'workflows.json'), 'w', encoding='utf-8') as f:
        json.dump({'workflows': workflows, 'total_count': len(workflows)}, f, indent=2, ensure_ascii=False)
    print(f"  Written workflows.json ({len(workflows)} workflows)")

    # ======================================================================
    # 4. MENUS
    # ======================================================================
    print("\n--- Extracting Menus ---")
    all_menus = []
    all_views = []

    for module in modules:
        views_dir = os.path.join(ADDONS_DIR, module, 'views')
        if not os.path.isdir(views_dir):
            continue
        for fname in sorted(os.listdir(views_dir)):
            if fname.endswith('.xml'):
                fpath = os.path.join(views_dir, fname)
                views, menus = parse_views_xml(fpath, module)
                all_views.extend(views)
                all_menus.extend(menus)

    # Also check data directory for menus
    for module in modules:
        data_dir = os.path.join(ADDONS_DIR, module, 'data')
        if not os.path.isdir(data_dir):
            continue
        for fname in sorted(os.listdir(data_dir)):
            if fname.endswith('.xml'):
                fpath = os.path.join(data_dir, fname)
                views, menus = parse_views_xml(fpath, module)
                all_views.extend(views)
                all_menus.extend(menus)

    with open(os.path.join(OUTPUT_DIR, 'menus.json'), 'w', encoding='utf-8') as f:
        json.dump({'menus': all_menus, 'total_count': len(all_menus)}, f, indent=2, ensure_ascii=False)
    print(f"  Written menus.json ({len(all_menus)} menu items)")

    # ======================================================================
    # 5. VIEWS
    # ======================================================================
    print("\n--- Extracting Views ---")

    with open(os.path.join(OUTPUT_DIR, 'views.json'), 'w', encoding='utf-8') as f:
        json.dump({'views': all_views, 'total_count': len(all_views)}, f, indent=2, ensure_ascii=False)
    print(f"  Written views.json ({len(all_views)} views)")

    # ======================================================================
    # 6. REPORTS
    # ======================================================================
    print("\n--- Extracting Reports ---")
    all_reports = []
    all_templates = []

    for module in modules:
        # Check report/ directory
        report_dir = os.path.join(ADDONS_DIR, module, 'report')
        if os.path.isdir(report_dir):
            for fname in sorted(os.listdir(report_dir)):
                if fname.endswith('.xml'):
                    fpath = os.path.join(report_dir, fname)
                    reports, templates = parse_report_xml(fpath, module)
                    all_reports.extend(reports)
                    all_templates.extend(templates)

        # Also check reports/ directory
        reports_dir = os.path.join(ADDONS_DIR, module, 'reports')
        if os.path.isdir(reports_dir):
            for fname in sorted(os.listdir(reports_dir)):
                if fname.endswith('.xml'):
                    fpath = os.path.join(reports_dir, fname)
                    reports, templates = parse_report_xml(fpath, module)
                    all_reports.extend(reports)
                    all_templates.extend(templates)

        # Check data/ for mail templates
        data_dir = os.path.join(ADDONS_DIR, module, 'data')
        if os.path.isdir(data_dir):
            for fname in sorted(os.listdir(data_dir)):
                if fname.endswith('.xml'):
                    fpath = os.path.join(data_dir, fname)
                    reports, templates = parse_report_xml(fpath, module)
                    all_reports.extend(reports)
                    all_templates.extend(templates)

        # Check views/ for embedded reports
        views_dir = os.path.join(ADDONS_DIR, module, 'views')
        if os.path.isdir(views_dir):
            for fname in sorted(os.listdir(views_dir)):
                if fname.endswith('.xml'):
                    fpath = os.path.join(views_dir, fname)
                    reports, templates = parse_report_xml(fpath, module)
                    all_reports.extend(reports)
                    all_templates.extend(templates)

    # Deduplicate reports by id
    seen_ids = set()
    deduped_reports = []
    for r in all_reports:
        key = (r['module'], r['id'])
        if key not in seen_ids:
            seen_ids.add(key)
            deduped_reports.append(r)

    seen_ids = set()
    deduped_templates = []
    for t in all_templates:
        key = (t['module'], t['id'])
        if key not in seen_ids:
            seen_ids.add(key)
            deduped_templates.append(t)

    with open(os.path.join(OUTPUT_DIR, 'reports.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'reports': deduped_reports,
            'email_templates': [t for t in deduped_templates if t.get('type') != 'qweb_template'],
            'qweb_templates': [t for t in deduped_templates if t.get('type') == 'qweb_template'],
            'total_reports': len(deduped_reports),
            'total_email_templates': len([t for t in deduped_templates if t.get('type') != 'qweb_template']),
            'total_qweb_templates': len([t for t in deduped_templates if t.get('type') == 'qweb_template']),
        }, f, indent=2, ensure_ascii=False)
    print(f"  Written reports.json ({len(deduped_reports)} reports, {len(deduped_templates)} templates)")

    # ======================================================================
    # 7. INTEGRATIONS
    # ======================================================================
    print("\n--- Extracting Integrations ---")
    integrations = extract_integrations(modules)

    with open(os.path.join(OUTPUT_DIR, 'integrations.json'), 'w', encoding='utf-8') as f:
        json.dump({'integrations': integrations, 'total_count': len(integrations)}, f, indent=2, ensure_ascii=False)
    print(f"  Written integrations.json ({len(integrations)} integrations)")

    # ======================================================================
    # 8. CAPABILITY MAP
    # ======================================================================
    print("\n--- Building Capability Map ---")
    capabilities = build_capability_map(modules, all_models)

    with open(os.path.join(OUTPUT_DIR, 'capability_map.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'capability_map': capabilities,
            'total_modules': len(modules),
            'total_domains': len(capabilities),
        }, f, indent=2, ensure_ascii=False)
    print(f"  Written capability_map.json ({len(capabilities)} domains)")

    # ======================================================================
    # Summary
    # ======================================================================
    print("\n" + "=" * 80)
    print("EXTRACTION COMPLETE")
    print("=" * 80)
    print(f"  Modules scanned:    {len(modules)}")
    print(f"  Models extracted:   {len(models_output)}")
    new_models = len([m for m in models_output if not m.get('is_extension')])
    ext_models = len([m for m in models_output if m.get('is_extension')])
    print(f"    - New models:     {new_models}")
    print(f"    - Extensions:     {ext_models}")
    total_fields = sum(len(m['fields']) for m in models_output)
    print(f"  Total fields:       {total_fields}")
    print(f"  Access rules:       {len(all_acl)}")
    print(f"  Record rules:       {len(all_record_rules)}")
    print(f"  Security groups:    {len(all_groups)}")
    print(f"  Workflows:          {len(workflows)}")
    print(f"  Menu items:         {len(all_menus)}")
    print(f"  Views:              {len(all_views)}")
    print(f"  Reports:            {len(deduped_reports)}")
    print(f"  Templates:          {len(deduped_templates)}")
    print(f"  Integrations:       {len(integrations)}")
    print(f"  Capability domains: {len(capabilities)}")
    print(f"\nOutput directory: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
