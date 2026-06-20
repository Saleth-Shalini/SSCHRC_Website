(function () {
    'use strict';

    var CANCER_FILES = [
        'Acoustic_Neuroma.html',
        'Acute Lymphocytic Leukaemia (ALL).html',
        'Acute_Myeloid_Leukaemia_AML.html',
        'Adrenal_Tumours.html',
        'adult_histiocyte_disorders.html',
        'anal_cancer_webpage.html',
        'Appendix_Cancer_Comprehensive_Overview.html',
        'Astrocytoma_IDH_Mutant.html',
        'B_cell_Lymphoma.html',
        'basal_cell_carcinoma.html',
        'Biliary_and_Gallbladder_Cancer.html',
        'bladder_cancer.html',
        'bone_cancer_webpage.html',
        'brain_tumours.html',
        'Breast_Cancer.html',
        'Breast_Implant_Associated_ALCL.html',
        'Cancer_of_Unknown_Primary_CUP.html',
        'Cervical_Cancer.html',
        'Childhood_Acute_Lymphocytic_Leukemia.html',
        'Childhood_Acute_Myeloid_Leukaemia.html',
        'Childhood_Brain_and_Spine_Tumours.html',
        'Childhood_Germ_Cell_Tumours.html',
        'Childhood_Haematology_Disorders.html',
        'Childhood_Liver_Cancer.html',
        'Childhood_Lymphoma.html',
        'Childhood_Melanoma.html',
        'Chronic_Lymphocytic_Leukemia_CLL.html',
        'Chronic_Myeloid_Leukemia_CML.html',
        'Colorectal_Cancer.html',
        'Cutaneous_T_cell_Lymphoma.html',
        'Desmoplastic_Small_Round_Cell_Tumours.html',
        'Ductal_Carcinoma_in_Situ.html',
        'Endometrial_Cancer.html',
        'Esophageal_Cancer.html',
        'ewing_sarcoma.html',
        'Eye_Cancer.html',
        'gallbladder_cancer.html',
        'gastrointestinal_cancer.html',
        'Gestational_Trophoblastic_Disease.html',
        'Glioblastoma.html',
        'Gynecologic_Cancers.html',
        'Head_and_Neck_Cancer.html',
        'Histiocytosis.html',
        'Hodgkin_Lymphoma.html',
        'Hypopharyngeal_Cancer.html',
        'Inflammatory_Breast_Cancer.html',
        'Kidney_Cancer.html',
        'Laryngeal_Cancer.html',
        'Leukaemia.html',
        'Liver_Cancer.html',
        'Lung_Cancer.html',
        'Lymphoma.html',
        'Mantle_Cell_Lymphoma.html',
        'Medulloblastoma.html',
        'Melanoma.html',
        'Merkel Cell Carcinoma.html',
        'Mesothelioma.html',
        'Multiple Myeloma.html',
        'Multiple_Endocrine_Neoplasia.html',
        'Myelodysplastic_Syndrome_MDS.html',
        'Myeloproliferative_Neoplasms.html',
        'Nasopharyngeal_Throat_Cancer.html',
        'Neuroblastoma.html',
        'Neuroendocrine_Tumours.html',
        'Neurofibromatosis.html',
        'Non_Hodgkin_Lymphoma.html',
        'Oral_Cancer.html',
        'Oropharyngeal_Cancer.html',
        'Osteosarcoma.html',
        'Ovarian Cancer.html',
        'Paediatric_Soft_Tissue_Sarcomas.html',
        'Paget_Disease_of_the_Breast.html',
        'Pancreatic_Cancer.html',
        'Parathyroid Disease.html',
        'Penile Cancer.html',
        'Pituitary Tumours.html',
        'Prostate_Cancer.html',
        'Retinoblastoma.html',
        'Salivary Gland Cancer.html',
        'Skin Cancer.html',
        'Skull_Base_Tumours.html',
        'Soft Tissue Sarcoma.html',
        'Spinal_Tumours.html',
        'Squamous_Cell_Carcinoma_of_the_Skin.html',
        'Stomach_Cancer.html',
        'Testicular_Cancer.html',
        'Throat_Cancer.html',
        'Thymoma_and_Thymic_Carcinoma.html',
        'Thyroid_Cancer.html',
        'Triple_Negative_Breast_Cancer.html',
        'Vaginal_Cancer.html',
        'Von_Hippel_Lindau_Disease.html',
        'Vulvar_Cancer.html',
        'Waldenstrom_Macroglobulinemia.html',
        'Wilms_Tumour.html'
    ];

    function cancerDisplayName(filename) {
        var name = filename.replace(/\.html$/, '').replace(/_/g, ' ');
        name = name.replace(/\s*\(/g, ' (');
        name = name.split(' ').map(function (word) {
            if (word.charAt(0) === '(' && word.length > 1) {
                return '(' + word.charAt(1).toUpperCase() + word.slice(2);
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
        return name;
    }

    function item(title, href) {
        return { title: title, href: href };
    }

    function buildSequences() {
        var sequences = [];

        sequences.push([
            item('About Us', 'About-shankara/About-Shankara.html'),
            item('Why Sri Shankara', 'About-shankara/Why-Sri-Shankara.html'),
            item('Our Journey', 'About-shankara/about-journey.html')
        ]);

        sequences.push([
            item('Surgical Oncology', 'Departments/Surgical_Oncology_Department.html'),
            item('Medical Oncology', 'Departments/Medical_Oncology_Department.html'),
            item('Radiation Oncology', 'Departments/Radiation_Oncology_Department.html'),
            item('Haemato-Oncology & BMT', 'Departments/Haemato_Oncology_BMT.html'),
            item('Paediatric Oncology & BMT', 'Departments/Paediatric_Oncology_BMT_Centre.html'),
            item('Head & Neck Oncology', 'Departments/Head_Neck_Cancer_Oncology_Department.html'),
            item('Gynaec Oncology', 'Departments/Gynaecological_Oncology_Department.html'),
            item('Genito-Urinary Oncology', 'Departments/Genito-Urinary_Oncology_Care.html'),
            item('Bone & Soft Tissue Oncology', 'Departments/Bone & Soft Tissue Department.html'),
            item('Neuro-Oncology', 'Departments/Neuro_Oncology_Department.html'),
            item('Plastic & Reconstructive Surgery', 'Departments/Plastic_Reconstructive_Surgery.html'),
            item('Interventional Pulmonology', 'Departments/Interventional_Pulmonology_Cancer_Care.html'),
            item('Pain & Palliative Care', 'Departments/Pain_Palliative_Care_Department.html'),
            item('Ophthalmic Oncology', 'Departments/Ophthalmic_Oncology.html'),
            item('Anaesthesiology', 'Departments/Onco_Anaesthesiology_Department.html'),
            item('Psycho-Oncology', 'Departments/Psycho_Oncology_Department_Complete.html'),
            item('Preventive Oncology', 'Departments/Community_Oncology_Department.html'),
            item('Radio diagnosis', 'Departments/Radio_diagnosis_Oncologic_Imaging_Department.html'),
            item('Nuclear Medicine', 'Departments/Nuclear_Medicine_Department.html'),
            item('Interventional Radiology', 'Departments/Interventional_Radiology_Cancer_Care.html'),
            item('Endocrinology', 'Departments/Endocrinology.html'),
            item('Cardiology', 'Departments/Cardio_Oncology_Department.html'),
            item('Gastroenterology', 'Departments/Gastroenterology_Department.html'),
            item('Nephrology', 'Departments/Nephrology_Department.html'),
            item('Transfusion Medicine & Blood Centre', 'Departments/Transfusion_Medicine_Blood_Centre.html'),
            item('Histopathology', 'Departments/Histopathology_Department_Complete.html'),
            item('Haematopathology', 'Departments/Haematopathology_Cancer_Care.html'),
            item('Molecular Diagnostics', 'Departments/Molecular_Oncology_Department_Complete.html'),
            item('Biochemistry', 'Departments/Biochemistry Department.html'),
            item('Microbiology & Virology', 'Departments/Microbiology_Virology_Department.html'),
            item('Domiciliary Care', 'Departments/Domiciliary_Care_Services.html'),
            item('Clinical Pharmacology', 'Departments/Clinical_Pharmacology_Department.html'),
            item('Physiotherapy & Rehabilitation', 'Departments/Physiotherapy_Rehabilitation_Department.html'),
            item('Nutrition & Dietetics', 'Departments/Nutrition_Dietetics_Enhanced.html'),
            item('Speech & Swallowing Therapy', 'Departments/Speech_Swallowing_Therapy.html'),
            item('Integrative Oncology', 'Departments/Integrative_Oncology.html')
        ]);

        sequences.push([
            item('Bone Marrow Transplant', 'Center-Of-Exellence/Bone-Marrow-Transplant.html'),
            item('Breast Cancer Care', 'Center-Of-Exellence/Breast-Cancer-Care.html'),
            item('Lung Cancer Care', 'Center-Of-Exellence/Lung-Cancer-Care.html'),
            item('Head and Neck Oncology', 'Center-Of-Exellence/Head-and-Neck-Oncology.html'),
            item('Gynaecologic Oncology', 'Center-Of-Exellence/Gynaecologic-Oncology.html'),
            item('Paediatric Oncology', 'Center-Of-Exellence/Paediatric-Oncology.html'),
            item('Robotic Surgery', 'Center-Of-Exellence/Robotic-Surgery.html'),
            item('Ophthalmic Oncology', 'Center-Of-Exellence/Ophthalmic-Oncology.html')
        ]);

        sequences.push([
            item('Book an Appointment', 'patient-services/book-appointment.html'),
            item('Our Services', 'patient-services/services.html'),
            item('Second Opinion', 'patient-services/Second-Opinion.html'),
            item('Insurance & Billing', 'patient-services/Insurance-Billing.html'),
            item('International Patients', 'patient-services/International-Patients.html')
        ]);

        sequences.push([
            item('Cancer Screening Packages', 'Diagnosis-&-Screening/Cancer-Screening-Packages.html'),
            item('Advanced Diagnostic Tests', 'Diagnosis-&-Screening/Advanced-Diagnostic-Tests.html')
        ]);

        sequences.push([
            item('Ongoing Clinical Trials', 'research/Ongoing-Clinical-Trial.html'),
            item('Research', 'research/Research.html'),
            item('Academics & Training', 'research/Academics.html')
        ]);

        sequences.push([
            item('Overview', 'research/Academics.html'),
            item('Vision & Mission', 'research/Academics.html#vision-mission'),
            item('Milestones', 'research/Academics.html#milestones'),
            item('Courses Offered', 'research/Academics.html#programmes'),
            item('Notifications', 'research/Academics.html#notifications')
        ]);

        sequences.push([
            item('Home', 'index.html'),
            item('About Us', 'About-shankara/About-Shankara.html')
        ]);

        sequences.push([
            item('Cancer Index', 'Cancer-We-Treat/cancerpedia_index.html')
        ].concat(CANCER_FILES.map(function (file) {
            return item(cancerDisplayName(file), 'Cancer-We-Treat/' + file);
        })));

        return sequences;
    }

    var NAV_SEQUENCES = buildSequences();

    var SECTION_BRIDGES = {
        'about-shankara/about-journey.html': item('Book an Appointment', 'patient-services/book-appointment.html'),
        'diagnosis-&-screening/advanced-diagnostic-tests.html': item('Ongoing Clinical Trials', 'research/Ongoing-Clinical-Trial.html'),
        'patient-services/international-patients.html': item('Cancer Index', 'Cancer-We-Treat/cancerpedia_index.html'),
        'research/academics.html#notifications': item('Book an Appointment', 'patient-services/book-appointment.html'),
        'departments/integrative oncology.html': item('Bone Marrow Transplant', 'Center-Of-Exellence/Bone-Marrow-Transplant.html'),
        'center-of-exellence/ophthalmic-oncology.html': item('Cancer Screening Packages', 'Diagnosis-&-Screening/Cancer-Screening-Packages.html'),
        'cancer-we-treat/wilms_tumour.html': item('Home', 'index.html')
    };

    var DEFAULT_NEXT = item('Book an Appointment', 'patient-services/book-appointment.html');

    function normalizeKey(value) {
        if (!value) return '';
        try {
            value = decodeURIComponent(value);
        } catch (e) {}
        return value.toLowerCase().replace(/\\/g, '/');
    }

    function getSiteRelativePath() {
        var path = normalizeKey(window.location.pathname);
        var markers = ['/sri_shankara/'];
        var i;
        for (i = 0; i < markers.length; i++) {
            var idx = path.indexOf(markers[i]);
            if (idx !== -1) {
                return path.slice(idx + markers[i].length);
            }
        }
        var parts = path.split('/').filter(Boolean);
        var known = {
            'departments': 1,
            'cancer-we-treat': 1,
            'patient-services': 1,
            'center-of-exellence': 1,
            'diagnosis-&-screening': 1,
            'research': 1,
            'about-shankara': 1,
            'doctors': 1,
            'headerbutton': 1,
            'events-and-programs': 1
        };
        for (i = 0; i < parts.length; i++) {
            if (known[parts[i]]) {
                return parts.slice(i).join('/');
            }
        }
        if (!parts.length || parts[parts.length - 1] === 'index.html') {
            return 'index.html';
        }
        return parts.join('/');
    }

    function pageKeyFromHref(href) {
        var base = 'https://example.com/Sri_Shankara/';
        var url = new URL(href, base);
        var path = normalizeKey(url.pathname);
        var idx = path.indexOf('/sri_shankara/');
        var rel = idx !== -1 ? path.slice(idx + '/sri_shankara/'.length) : path.replace(/^\//, '');
        if (url.hash) {
            rel += normalizeKey(url.hash);
        }
        return rel;
    }

    function getCurrentPageKey() {
        var rel = getSiteRelativePath();
        if (window.location.hash) {
            rel += normalizeKey(window.location.hash);
        } else if (/\/academics\.html$/i.test(rel)) {
            rel = 'research/academics.html';
        }
        return rel;
    }

    function resolveTargetHref(targetHref) {
        var siteRel = getSiteRelativePath();
        var depth = (siteRel.match(/\//g) || []).length;
        var prefix = depth ? new Array(depth + 1).join('../') : '';
        return prefix + targetHref;
    }

    function findNextPage() {
        var current = getCurrentPageKey();
        var s, i, keys, next;

        for (s = 0; s < NAV_SEQUENCES.length; s++) {
            keys = NAV_SEQUENCES[s].map(function (entry) {
                return pageKeyFromHref(entry.href);
            });
            for (i = 0; i < keys.length; i++) {
                if (keys[i] === current) {
                    next = NAV_SEQUENCES[s][i + 1];
                    if (next) {
                        return next;
                    }
                }
            }
        }

        if (SECTION_BRIDGES[current]) {
            return SECTION_BRIDGES[current];
        }

        if (current !== 'index.html' && current.indexOf('index.html') === -1) {
            return DEFAULT_NEXT;
        }

        return null;
    }

    function getFooterElement() {
        var footers = document.querySelectorAll('#hospital-footer');
        if (!footers.length) {
            return null;
        }
        return footers[footers.length - 1];
    }

    function renderUpNext() {
        var footer = getFooterElement();
        if (!footer) {
            return false;
        }

        var existing = document.getElementById('sschrc-up-next');
        if (existing) {
            if (footer.previousElementSibling === existing) {
                return true;
            }
            existing.remove();
        }

        var next = findNextPage();
        if (!next) {
            return false;
        }

        var section = document.createElement('section');
        section.id = 'sschrc-up-next';
        section.className = 'sschrc-up-next';
        section.setAttribute('aria-label', 'Up next');
        section.innerHTML =
            '<div class="sschrc-up-next__inner">' +
                '<div class="sschrc-up-next__content">' +
                    '<span class="sschrc-up-next__label">Up Next</span>' +
                    '<a class="sschrc-up-next__link" href="' + resolveTargetHref(next.href) + '">' +
                        '<span>' + next.title + '</span>' +
                        '<span class="sschrc-up-next__arrow" aria-hidden="true">&rarr;</span>' +
                    '</a>' +
                '</div>' +
            '</div>';

        footer.insertAdjacentElement('beforebegin', section);
        return true;
    }

    function initUpNext() {
        if (renderUpNext()) {
            return;
        }
        var attempts = 0;
        var timer = window.setInterval(function () {
            attempts += 1;
            if (renderUpNext() || attempts >= 20) {
                window.clearInterval(timer);
            }
        }, 150);
    }

    window.sschrcRenderUpNext = renderUpNext;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUpNext);
    } else {
        initUpNext();
    }

    window.addEventListener('load', function () {
        renderUpNext();
    });
})();
