import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CottageMasterService } from './cottage-master.service';
import { SnackBarService } from '../../../shared/services/snack-bar.service';
import { ErrorResponse } from '../../../utils/server-response';
import { CommonServiceService } from '../../../globals/services/common-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { IColumnSchema, ICottage } from '../../../globals/interface';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EMage } from '../../../globals/enums/image';
import { MatDialog } from '@angular/material/dialog';
import { CottageDialogComponent } from '../../dialog/cottage-dialog/cottage-dialog.component';

@Component({
  selector: 'app-cottage-master',
  templateUrl: './cottage-master.component.html',
  styleUrls: ['./cottage-master.component.css']
})
export class CottageMasterComponent implements OnInit {
	

	cottageForm!: FormGroup;
	typeList: string[] = ['floating', 'non-floating'];
	file!: File;
	url: string | ArrayBuffer  = "assets/addPhoto.jpg";
	dataCottage = new MatTableDataSource<ICottage>([]);
	@ViewChild('cottagePaginator') cottagePaginator!: MatPaginator ;
	@ViewChild('cottageSort') cottageSort!: MatSort;

	base64: string = EMage.BASE64_INITIAL; 
	fileChanges!: string | ArrayBuffer;
	btnName: string = "Save";

	column_schema: IColumnSchema[] = [
		{
			key: "images",
			type: "images",
			label: "image"
		},
		{
			key: "type",
			type: "type",
			label: "cottage type"
		},
		{
			key: "cottage_number",
			type: "text",
			label: "cottage number"
		},
		{
			key: "capacity",
			type: "text",
			label: "capacity"
		},
		{
			key: "description",
			type: "text",
			label: "description"
		},
		{
			key: "price",
			type: "price",
			label: "price"
		},
		{
			key: "isEdit",
			type: "isEdit",
			label: "Action"
		}
	];

	displayColumns: string[] = this.column_schema.map((x) => (x.key));

  constructor(
		private fb: FormBuilder, 
		private http_cottage: CottageMasterService, 
		private snackBar: SnackBarService,
		private common: CommonServiceService,
		private dialog: MatDialog,) {
		this.cottageForm = this.fb.group({
			type: [null, Validators.required],
			cottageNumber: [null, Validators.required],
			capacity: [null, Validators.required],
			price: [null, Validators.required],
			description: [null, Validators.required],
			images: [null, Validators.required],
		});

	}

	get type () {
		return this.cottageForm.get('type');
	}

	get cottageNumber () {
		return this.cottageForm.get('cottageNumber');
	}

	get capacity () {
		return this.cottageForm.get('capacity');
	}

	get price () {
		return this.cottageForm.get('price');
	}

	get description () {
		return this.cottageForm.get('description');
	}

  ngOnInit(): void {
		this.getCottage();
  }

	ngAfterViewInit(): void {
		this.dataCottage.paginator = this.cottagePaginator;
		this.dataCottage.sort = this.cottageSort;
	}

	clickFileChanges(): void {
		this.btnName = "Save Changes"
	}

	changeImage(event: any) {

		this.file = event.target.files[0];

		const reader = new FileReader();
		
		reader.readAsDataURL(this.file);

		reader.onload = (event: any) => {
			(this.btnName === "Save") ? this.url = event.target.result : this.fileChanges = event.target.result;
		}

		this.cottageForm.get('images')?.patchValue(this.file);

	}

	async saveCottage () {
		if (this.cottageForm.invalid) {
			this.cottageForm.markAllAsTouched();
		} else {
			try {
				
				const formData = new FormData();

				formData.append("images", this.file);

				for (let item of Object.keys(this.cottageForm.value)) {
					formData.append(item, this.cottageForm.value[item])
				}

				const response = await this.http_cottage.saveCottage(formData);
				this.snackBar._showSnack(response.message, "success");
				this.common.reset(this.cottageForm);
				this.url = "assets/addPhoto.jpg";
				this.ngOnInit();
				
			} catch (err) {
				const error = ErrorResponse(err);
				this.snackBar._showSnack(`${error.myError} ${error.status}`, "error");
			}
		}
	}
	
	async getCottage() {
		try {
			const response = await this.http_cottage.getCottage();
			this.snackBar._showSnack(response.message, "success");
			this.dataCottage.data = response.data as ICottage[];
			
		} catch (err) {
			const error = ErrorResponse(err);
			this.snackBar._showSnack(`${error.myError} ${error.status}`, "error");
		}
	}

	passImage(element: ICottage): void {
		this.fileChanges = `${this.base64}, ${element.images?.[0]}`
	}

	async updateCottage(element: ICottage): Promise<void> {
		try {
			/**
			 * this.file not selected value is undefined
			 */
			

			// const formData = new FormData();

			// console.log(element, this.file);

			// const result = await convertBlobToBase64(element.images as unknown as Blob);
			
			// console.log(result);
			

			// const blob = new Blob(element.images);

			// formData.append("images", element.images as string);

			// for (let item of Object.keys(element)) {
			// 	formData.append(item, element[item])
			// }

			// const response = await this.http_cottage.updateCottage(element);

		} catch (err) {
			console.log(err);
			
			const error = ErrorResponse(err);
			this.snackBar._showSnack(`${error.myError} ${error.status}`, "error");
		}
	}

	viewCottage(element: ICottage): void {
		this.dialog.open(CottageDialogComponent, {width: '800px', data: element, panelClass: 'myClass'});
	}

}
const convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});
